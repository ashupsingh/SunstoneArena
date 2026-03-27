import { Response, NextFunction } from 'express';
import { z } from 'zod';
import Schedule from '../models/Schedule';
import Notification from '../models/Notification';
import User from '../models/User';
import AttendanceSession from '../models/AttendanceSession';
import { transporter } from '../config/emailService';
import { sendPushToUsers } from '../config/pushService';
import { broadcastRealtimeSync } from '../config/realtime';
import { AuthRequest } from '../middleware/authMiddleware';

// Zod schemas
export const rescheduleSchema = z.object({
    rescheduledDate: z.string().min(1, 'New date is required'),
    rescheduledStartTime: z.string().optional(),
    rescheduledEndTime: z.string().optional(),
    rescheduledRoom: z.string().optional(),
    rescheduledReason: z.string().min(1, 'Reason is required'),
});

export const createScheduleSchema = z.object({
    type: z.enum(['class', 'lab']),
    subject: z.string().min(1, 'Subject is required'),
    teacher: z.string().min(1, 'Teacher ID is required'),
    department: z.string().min(1, 'Department ID is required'),
    dayOfWeek: z.string().min(1, 'Day of week is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    room: z.string().optional(),
    lab: z.string().optional(),
    semester: z.number().optional(),
    section: z.string().optional(),
});

export const markAttendanceSchema = z.object({
    bluetoothCode: z.string().min(4, 'Bluetooth code is required').optional(),
    bleServiceUuid: z.string().uuid('Valid BLE service UUID is required').optional(),
}).refine((data) => !!data.bluetoothCode || !!data.bleServiceUuid, {
    message: 'Either bluetoothCode or bleServiceUuid is required',
});

export const manualAttendanceSchema = z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    present: z.boolean().default(true),
    note: z.string().optional(),
});

const randomCode = (): string => String(Math.floor(100000 + Math.random() * 900000));

const randomHex = (): string => Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
const randomBleServiceUuid = (): string => `${randomHex()}${randomHex()}-${randomHex()}-${randomHex()}-${randomHex()}-${randomHex()}${randomHex()}${randomHex()}`;

const buildAttendanceReport = async (sessionId: string) => {
    const session = await AttendanceSession.findById(sessionId)
        .populate('expectedStudents', 'name email rollNumber enrollmentNumber department')
        .lean();

    if (!session) return null;

    const recordMap = new Map(
        (session.records || []).map((r: any) => [String(r.student), r])
    );

    const students = (session.expectedStudents as any[]).map((s) => {
        const rec = recordMap.get(String(s._id));
        return {
            studentId: s._id,
            name: s.name,
            email: s.email,
            rollNumber: s.rollNumber,
            enrollmentNumber: s.enrollmentNumber,
            status: rec?.status || 'absent',
            source: rec?.source || null,
            markedAt: rec?.markedAt || null,
            note: rec?.note || null,
        };
    });

    const presentCount = students.filter((s) => s.status === 'present').length;
    const absentCount = students.length - presentCount;

    return {
        sessionId: session._id,
        scheduleId: session.schedule,
        status: session.status,
        bluetoothCode: session.status === 'active' ? session.bluetoothCode : undefined,
        bleServiceUuid: session.status === 'active' ? session.bleServiceUuid : undefined,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        totalStudents: students.length,
        presentCount,
        absentCount,
        students,
    };
};

// Get schedules for a department
export const getSchedules = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const filter: Record<string, string> = {};
        if (typeof req.query.departmentId === 'string') filter.department = req.query.departmentId;
        if (typeof req.query.dayOfWeek === 'string') filter.dayOfWeek = req.query.dayOfWeek;

        const schedules = await Schedule.find(filter)
            .populate('teacher', 'name email')
            .populate('department', 'name code')
            .populate('lab', 'name building roomNumber')
            .sort({ startTime: 1 });
        res.json(schedules);
    } catch (error) {
        next(error);
    }
};

// Get my schedule (teacher)
export const getMySchedule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const schedules = await Schedule.find({ teacher: req.user!._id })
            .populate('department', 'name code')
            .populate('lab', 'name building roomNumber')
            .sort({ dayOfWeek: 1, startTime: 1 });
        res.json(schedules);
    } catch (error) {
        next(error);
    }
};

// Create schedule — uses validated data only
export const createSchedule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = createScheduleSchema.parse(req.body);
        const schedule = await Schedule.create(data);
        const populated = await schedule.populate([
            { path: 'teacher', select: 'name email' },
            { path: 'department', select: 'name code' },
        ]);

        const students = await User.find({ role: 'student', department: data.department }).select('_id');
        await Notification.create({
            title: `New Class Schedule: ${schedule.subject}`,
            message: `${(populated.teacher as any)?.name || 'Teacher'} added ${schedule.subject} on ${schedule.dayOfWeek} (${schedule.startTime} - ${schedule.endTime}).`,
            type: 'schedule_change',
            sender: req.user!._id,
            targetDepartment: data.department as any,
            targetRole: 'student',
            recipients: students.map((s) => s._id),
            relatedSchedule: schedule._id,
        });

        await sendPushToUsers(
            students.map((s) => s._id as any),
            `New Class Schedule: ${schedule.subject}`,
            `${schedule.dayOfWeek} ${schedule.startTime} - ${schedule.endTime}`,
            { type: 'schedule_change', scheduleId: String(schedule._id) }
        );

        broadcastRealtimeSync('schedule.created');

        res.status(201).json(populated);
    } catch (error) {
        next(error);
    }
};

// Update schedule — whitelist fields
export const updateSchedule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const allowed = ['subject', 'room', 'dayOfWeek', 'startTime', 'endTime', 'semester', 'section', 'lab'];
        const updates: Record<string, any> = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        const existing = await Schedule.findById(req.params.id);
        if (!existing) {
            res.status(404).json({ message: 'Schedule not found' });
            return;
        }

        if (req.user!.role !== 'superadmin' && existing.teacher.toString() !== req.user!._id.toString()) {
            res.status(403).json({ message: 'You can only update your own schedules' });
            return;
        }

        const schedule = await Schedule.findByIdAndUpdate(req.params.id, updates, { new: true })
            .populate('teacher', 'name email')
            .populate('department', 'name code');

        if (schedule) {
            const departmentId = (schedule.department as any)?._id || schedule.department;
            const students = await User.find({ role: 'student', department: departmentId }).select('_id');
            await Notification.create({
                title: `Schedule Updated: ${schedule.subject}`,
                message: `${(schedule.teacher as any)?.name || 'Teacher'} updated ${schedule.subject} (${schedule.dayOfWeek} ${schedule.startTime} - ${schedule.endTime}).`,
                type: 'schedule_change',
                sender: req.user!._id,
                targetDepartment: departmentId as any,
                targetRole: 'student',
                recipients: students.map((s) => s._id),
                relatedSchedule: schedule._id,
            });

            await sendPushToUsers(
                students.map((s) => s._id as any),
                `Schedule Updated: ${schedule.subject}`,
                `${schedule.dayOfWeek} ${schedule.startTime} - ${schedule.endTime}`,
                { type: 'schedule_change', scheduleId: String(schedule._id) }
            );

            broadcastRealtimeSync('schedule.updated');
        }

        res.json(schedule);
    } catch (error) {
        next(error);
    }
};

// Reschedule a class
export const rescheduleClass = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { rescheduledDate, rescheduledStartTime, rescheduledEndTime, rescheduledRoom, rescheduledReason } = req.body;

        const schedule = await Schedule.findById(req.params.id)
            .populate<{ teacher: { _id: string; name: string; email: string } }>('teacher', 'name email')
            .populate<{ department: { _id: string; name: string; code: string } }>('department', 'name code');

        if (!schedule) {
            res.status(404).json({ message: 'Schedule not found' });
            return;
        }

        if (req.user!.role !== 'superadmin' && schedule.teacher._id.toString() !== req.user!._id.toString()) {
            res.status(403).json({ message: 'You can only reschedule your own classes' });
            return;
        }

        schedule.isRescheduled = true;
        schedule.rescheduledDate = rescheduledDate;
        schedule.rescheduledStartTime = rescheduledStartTime || schedule.startTime;
        schedule.rescheduledEndTime = rescheduledEndTime || schedule.endTime;
        schedule.rescheduledRoom = rescheduledRoom || schedule.room;
        schedule.rescheduledReason = rescheduledReason;
        await schedule.save();

        const dept = schedule.department as { _id: string; name: string; code: string };
        const teacher = schedule.teacher as { _id: string; name: string; email: string };

        const students = await User.find({ role: 'student', department: dept._id });

        const notification = await Notification.create({
            title: `Class Rescheduled: ${schedule.subject}`,
            message: `${schedule.subject} by ${teacher.name} has been rescheduled. Reason: ${rescheduledReason}. New time: ${rescheduledStartTime || schedule.startTime} - ${rescheduledEndTime || schedule.endTime} on ${new Date(rescheduledDate).toLocaleDateString()}.`,
            type: 'schedule_change',
            sender: req.user!._id,
            targetDepartment: dept._id,
            targetRole: 'student',
            recipients: students.map((s) => s._id),
            relatedSchedule: schedule._id,
        });

        await sendPushToUsers(
            students.map((s) => s._id as any),
            `Class Rescheduled: ${schedule.subject}`,
            `New timing: ${rescheduledStartTime || schedule.startTime} - ${rescheduledEndTime || schedule.endTime}`,
            { type: 'schedule_change', scheduleId: String(schedule._id), notificationId: String(notification._id) }
        );

        broadcastRealtimeSync('schedule.rescheduled');

        // Send emails — use BCC to protect student privacy
        const studentEmails = students.map((s) => s.email).filter(Boolean);
        if (studentEmails.length > 0) {
            try {
                await transporter.sendMail({
                    from: `"SyntaxError" <${process.env.GMAIL_USER}>`,
                    to: process.env.GMAIL_USER,
                    bcc: studentEmails.join(','),
                    subject: `📅 Class Rescheduled: ${schedule.subject}`,
                    html: `
                        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f172a; border-radius: 16px; padding: 40px; color: #e2e8f0;">
                            <h1 style="margin: 0 0 8px; font-size: 20px;"><span style="color: #e2e8f0;">Syntax</span><span style="color: #818cf8;">Error</span></h1>
                            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 24px;">Schedule Change Notification</p>
                            <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px;">
                                <h2 style="color: #f59e0b; font-size: 16px; margin: 0 0 12px;">⚠️ ${schedule.subject} — Rescheduled</h2>
                                <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 8px;"><strong>Teacher:</strong> ${teacher.name}</p>
                                <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 8px;"><strong>New Date:</strong> ${new Date(rescheduledDate).toLocaleDateString()}</p>
                                <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 8px;"><strong>New Time:</strong> ${rescheduledStartTime || schedule.startTime} - ${rescheduledEndTime || schedule.endTime}</p>
                                ${rescheduledRoom ? `<p style="color: #cbd5e1; font-size: 14px; margin: 0 0 8px;"><strong>Room:</strong> ${rescheduledRoom}</p>` : ''}
                                <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 0;"><strong>Reason:</strong> ${rescheduledReason}</p>
                            </div>
                        </div>
                    `,
                });
            } catch (emailErr) {
                console.error('Email send error:', emailErr);
            }
        }

        res.json({ schedule, notification, emailsSent: studentEmails.length });
    } catch (error) {
        next(error);
    }
};

// Cancel a class
export const cancelClass = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const schedule = await Schedule.findById(req.params.id)
            .populate<{ teacher: { _id: string; name: string; email: string } }>('teacher', 'name email')
            .populate<{ department: { _id: string; name: string; code: string } }>('department', 'name code');

        if (!schedule) {
            res.status(404).json({ message: 'Schedule not found' });
            return;
        }

        if (req.user!.role !== 'superadmin' && schedule.teacher._id.toString() !== req.user!._id.toString()) {
            res.status(403).json({ message: 'You can only cancel your own classes' });
            return;
        }

        const dept = schedule.department as { _id: string; name: string; code: string };
        const teacher = schedule.teacher as { _id: string; name: string; email: string };

        schedule.isCancelled = true;
        schedule.rescheduledReason = req.body.reason || 'Class cancelled';
        await schedule.save();

        const students = await User.find({ role: 'student', department: dept._id });

        const notification = await Notification.create({
            title: `Class Cancelled: ${schedule.subject}`,
            message: `${schedule.subject} by ${teacher.name} on ${schedule.dayOfWeek} has been cancelled. Reason: ${req.body.reason || 'Not specified'}.`,
            type: 'schedule_change',
            sender: req.user!._id,
            targetDepartment: dept._id,
            targetRole: 'student',
            recipients: students.map((s) => s._id),
            relatedSchedule: schedule._id,
        });

        await sendPushToUsers(
            students.map((s) => s._id as any),
            `Class Cancelled: ${schedule.subject}`,
            req.body.reason || 'Class has been cancelled',
            { type: 'schedule_change', scheduleId: String(schedule._id), notificationId: String(notification._id) }
        );

        broadcastRealtimeSync('schedule.cancelled');

        res.json({ message: 'Class cancelled and students notified', schedule });
    } catch (error) {
        next(error);
    }
};

// Delete schedule
export const deleteSchedule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const schedule = await Schedule.findById(req.params.id);
        if (!schedule) {
            res.status(404).json({ message: 'Schedule not found' });
            return;
        }

        if (req.user!.role !== 'superadmin' && schedule.teacher.toString() !== req.user!._id.toString()) {
            res.status(403).json({ message: 'You can only delete your own schedules' });
            return;
        }

        await schedule.deleteOne();
        broadcastRealtimeSync('schedule.deleted');
        res.json({ message: 'Schedule deleted' });
    } catch (error) {
        next(error);
    }
};

export const startAttendanceSession = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const schedule = await Schedule.findById(req.params.id);
        if (!schedule) {
            res.status(404).json({ message: 'Schedule not found' });
            return;
        }

        if (req.user!.role !== 'superadmin' && schedule.teacher.toString() !== req.user!._id.toString()) {
            res.status(403).json({ message: 'You can only start attendance for your own class' });
            return;
        }

        const students = await User.find({ role: 'student', department: schedule.department }).select('_id');

        const existing = await AttendanceSession.findOne({ schedule: schedule._id, status: 'active' });
        if (existing) {
            const report = await buildAttendanceReport(String(existing._id));
            res.json(report);
            return;
        }

        const session = await AttendanceSession.create({
            schedule: schedule._id,
            teacher: req.user!._id,
            department: schedule.department,
            status: 'active',
            bluetoothCode: randomCode(),
            bleServiceUuid: randomBleServiceUuid(),
            startedAt: new Date(),
            expectedStudents: students.map((s) => s._id),
            records: [],
        });

        broadcastRealtimeSync('attendance.started');
        const report = await buildAttendanceReport(String(session._id));
        res.status(201).json(report);
    } catch (error) {
        next(error);
    }
};

export const getActiveAttendanceSession = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const session = await AttendanceSession.findOne({ schedule: req.params.id, status: 'active' });
        if (!session) {
            res.status(404).json({ message: 'No active attendance session for this class' });
            return;
        }

        const report = await buildAttendanceReport(String(session._id));
        res.json(report);
    } catch (error) {
        next(error);
    }
};

export const markAttendanceViaBluetooth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { bluetoothCode, bleServiceUuid } = markAttendanceSchema.parse(req.body);

        if (req.user?.role !== 'student') {
            res.status(403).json({ message: 'Only students can mark attendance from bluetooth session' });
            return;
        }

        const session = await AttendanceSession.findOne({ schedule: req.params.id, status: 'active' });
        if (!session) {
            res.status(404).json({ message: 'No active attendance session for this class' });
            return;
        }

        const codeValid = !!bluetoothCode && session.bluetoothCode === bluetoothCode.trim();
        const uuidValid = !!bleServiceUuid && session.bleServiceUuid.toLowerCase() === bleServiceUuid.toLowerCase();
        if (!codeValid && !uuidValid) {
            res.status(400).json({ message: 'Bluetooth handshake validation failed. Move closer and retry scan.' });
            return;
        }

        const expected = session.expectedStudents.some((id) => id.toString() === req.user!._id.toString());
        if (!expected) {
            res.status(403).json({ message: 'You are not registered for this class attendance list' });
            return;
        }

        const recordIndex = session.records.findIndex((r) => r.student.toString() === req.user!._id.toString());
        if (recordIndex >= 0) {
            session.records[recordIndex].status = 'present';
            session.records[recordIndex].markedAt = new Date();
            session.records[recordIndex].source = 'bluetooth_auto';
            session.records[recordIndex].note = undefined;
        } else {
            session.records.push({
                student: req.user!._id as any,
                status: 'present',
                markedAt: new Date(),
                source: 'bluetooth_auto',
            });
        }

        await session.save();
        broadcastRealtimeSync('attendance.marked');

        const report = await buildAttendanceReport(String(session._id));
        res.json({ message: 'Attendance marked successfully', report });
    } catch (error) {
        next(error);
    }
};

export const manualMarkAttendance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { studentId, present, note } = manualAttendanceSchema.parse(req.body);
        const session = await AttendanceSession.findOne({ schedule: req.params.id, status: 'active' });

        if (!session) {
            res.status(404).json({ message: 'No active attendance session for this class' });
            return;
        }

        if (req.user!.role !== 'superadmin' && session.teacher.toString() !== req.user!._id.toString()) {
            res.status(403).json({ message: 'Only assigned teacher can manually mark attendance' });
            return;
        }

        const expected = session.expectedStudents.some((id) => id.toString() === studentId);
        if (!expected) {
            res.status(400).json({ message: 'Student is not part of the registered attendance list' });
            return;
        }

        const recordIndex = session.records.findIndex((r) => r.student.toString() === studentId);
        if (recordIndex >= 0) {
            session.records[recordIndex].status = present ? 'present' : 'absent';
            session.records[recordIndex].markedAt = new Date();
            session.records[recordIndex].source = 'teacher_manual';
            session.records[recordIndex].note = note;
        } else {
            session.records.push({
                student: studentId as any,
                status: present ? 'present' : 'absent',
                markedAt: new Date(),
                source: 'teacher_manual',
                note,
            });
        }

        await session.save();
        broadcastRealtimeSync('attendance.manual_mark');

        const report = await buildAttendanceReport(String(session._id));
        res.json({ message: 'Attendance updated', report });
    } catch (error) {
        next(error);
    }
};

export const closeAttendanceSession = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const session = await AttendanceSession.findOne({ schedule: req.params.id, status: 'active' });

        if (!session) {
            res.status(404).json({ message: 'No active attendance session for this class' });
            return;
        }

        if (req.user!.role !== 'superadmin' && session.teacher.toString() !== req.user!._id.toString()) {
            res.status(403).json({ message: 'Only assigned teacher can close attendance session' });
            return;
        }

        session.status = 'closed';
        session.endedAt = new Date();
        await session.save();

        broadcastRealtimeSync('attendance.closed');
        const report = await buildAttendanceReport(String(session._id));
        res.json({ message: 'Attendance session closed', report });
    } catch (error) {
        next(error);
    }
};

export const getAttendanceReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const session = await AttendanceSession.findOne({ schedule: req.params.id }).sort({ createdAt: -1 });
        if (!session) {
            res.status(404).json({ message: 'No attendance data found for this class' });
            return;
        }

        const isTeacher = req.user?.role === 'teacher' || req.user?.role === 'superadmin';
        if (isTeacher && req.user!.role !== 'superadmin' && session.teacher.toString() !== req.user!._id.toString()) {
            res.status(403).json({ message: 'You can only view report for your own class attendance' });
            return;
        }

        if (req.user?.role === 'student') {
            const allowed = session.expectedStudents.some((id) => id.toString() === req.user!._id.toString());
            if (!allowed) {
                res.status(403).json({ message: 'Not authorized for this attendance report' });
                return;
            }
        }

        const report = await buildAttendanceReport(String(session._id));
        res.json(report);
    } catch (error) {
        next(error);
    }
};

export const getAttendanceHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }

        if (req.user.role === 'student') {
            const sessions = await AttendanceSession.find({ expectedStudents: req.user._id })
                .populate('schedule', 'subject dayOfWeek startTime endTime room')
                .sort({ startedAt: -1 })
                .lean();

            const rows = sessions.map((session: any) => {
                const schedule = session.schedule || {};
                const record = (session.records || []).find((r: any) => String(r.student) === String(req.user!._id));
                const status = record?.status || 'absent';
                const attendanceDate = session.startedAt || session.createdAt;

                return {
                    sessionId: session._id,
                    scheduleId: schedule._id,
                    subject: schedule.subject || 'Class',
                    dayOfWeek: schedule.dayOfWeek,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    room: schedule.room,
                    attendanceDate,
                    status,
                    markedAt: record?.markedAt || null,
                    source: record?.source || null,
                };
            });

            const total = rows.length;
            const presentRows = rows.filter((r) => r.status === 'present');
            const present = presentRows.length;
            const percentage = total > 0 ? Number(((present / total) * 100).toFixed(2)) : 0;

            res.json({
                role: 'student',
                summary: {
                    totalClasses: total,
                    presentClasses: present,
                    absentClasses: total - present,
                    attendancePercentage: percentage,
                },
                presentClassSubjects: [...new Set(presentRows.map((r) => r.subject))],
                datewise: rows,
            });
            return;
        }

        const teacherFilter = req.user.role === 'superadmin' ? {} : { teacher: req.user._id };
        const sessions = await AttendanceSession.find(teacherFilter)
            .populate('schedule', 'subject dayOfWeek startTime endTime room')
            .sort({ startedAt: -1 })
            .lean();

        const rows = sessions.map((session: any) => {
            const schedule = session.schedule || {};
            const expected = Array.isArray(session.expectedStudents) ? session.expectedStudents.length : 0;
            const present = Array.isArray(session.records)
                ? session.records.filter((r: any) => r.status === 'present').length
                : 0;

            return {
                sessionId: session._id,
                scheduleId: schedule._id,
                subject: schedule.subject || 'Class',
                dayOfWeek: schedule.dayOfWeek,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                room: schedule.room,
                attendanceDate: session.startedAt || session.createdAt,
                status: session.status,
                presentCount: present,
                absentCount: Math.max(0, expected - present),
                totalStudents: expected,
            };
        });

        const totalSessions = rows.length;
        const totalStudentsMarked = rows.reduce((sum, row) => sum + row.presentCount, 0);
        const totalCapacity = rows.reduce((sum, row) => sum + row.totalStudents, 0);
        const averageAttendance = totalCapacity > 0 ? Number(((totalStudentsMarked / totalCapacity) * 100).toFixed(2)) : 0;

        res.json({
            role: req.user.role,
            summary: {
                totalSessions,
                totalStudentsMarked,
                averageAttendancePercentage: averageAttendance,
            },
            datewise: rows,
        });
    } catch (error) {
        next(error);
    }
};
