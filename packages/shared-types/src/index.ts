// ---------- User Types ----------
export interface IUser {
    _id?: string;
    name: string;
    email: string;
    role: 'student' | 'teacher' | 'superadmin';
    rollNumber?: string;
    enrollmentNumber?: string;
    phoneNumber?: string;
    profilePicture?: string;
    expoPushTokens?: string[];
    isApproved?: boolean;
    isFlagged?: boolean;
    flagReason?: string;
    courseName?: string;
    employeeId?: string;
    designation?: string;
    specialization?: string;
    departmentName: string;
    branchName?: string;
    department?: IDepartment | string;
    createdAt?: Date;
    updatedAt?: Date;
}

// ---------- Department Types ----------
export interface IDepartment {
    _id?: string;
    name: string;
    code: string;
    faculty: string;
    building?: string;
    floor?: string;
    hodName?: string;
    hodEmail?: string;
    hodAvailable: boolean;
    hodAvailableNote: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// ---------- Schedule Types ----------
export interface ISchedule {
    _id?: string;
    type: 'class' | 'lab';
    subject: string;
    teacher: IUser | string;
    department: IDepartment | string;
    lab?: ILab | string;
    room?: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    semester?: number;
    section?: string;
    isRescheduled: boolean;
    rescheduledDate?: Date;
    rescheduledStartTime?: string;
    rescheduledEndTime?: string;
    rescheduledRoom?: string;
    rescheduledReason?: string;
    isCancelled: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

// ---------- Notification Types ----------
export interface INotification {
    _id?: string;
    title: string;
    message: string;
    type: 'schedule_change' | 'announcement' | 'crowd_alert' | 'system';
    sender?: IUser | string;
    targetDepartment?: IDepartment | string;
    targetRole?: 'student' | 'teacher' | 'all';
    recipients: (IUser | string)[];
    readBy: (IUser | string)[];
    relatedSchedule?: ISchedule | string;
    createdAt?: Date;
    updatedAt?: Date;
    isRead?: boolean; // Used on frontend
}

// ---------- Bus Route Types ----------
export interface IBusRoute {
    _id?: string;
    routeName: string;
    busNumber?: string;
    driverName?: string;
    driverContact?: string;
    stops: { name: string; arrivalTime: string; order: number }[];
    departureTime: string;
    arrivalTimeCampus: string;
    returnDepartureTime?: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

// ---------- Food Court Types ----------
export interface IFoodCourt {
    _id?: string;
    name: string;
    location: string;
    capacity: number;
    cameraId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ICrowdStatus {
    _id?: string;
    foodCourtId: IFoodCourt | string;
    peopleCount: number;
    crowdLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'OVERCROWDED';
    createdAt?: Date;
    updatedAt?: Date;
}

// ---------- Lab Types ----------
export interface ILab {
    _id?: string;
    name: string;
    building: string;
    floor?: string;
    roomNumber?: string;
    capacity: number;
    department: IDepartment | string;
    equipment: string[];
    isAvailable: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

// ---------- API Responses ----------
export interface LoginResponse extends IUser {
    token: string;
}

export interface ApiError {
    message: string;
    errors?: string[];
}
