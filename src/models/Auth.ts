export enum AuthStatusEnum {
    INITIALIZING = 'initializing',
    LOADING_PROFILE = 'loading_profile',
    AUTHENTICATED = 'authenticated',
    UNAUTHENTICATED = 'unauthenticated'
};

export enum AuthStateChangeEventEnum {
    SIGNED_IN = 'SIGNED_IN',
    SIGNED_OUT = 'SIGNED_OUT',
    TOKEN_REFRESHED = 'TOKEN_REFRESHED',
    INITIAL_SESSION = 'INITIAL_SESSION',
    PASSWORD_RECOVERY = 'PASSWORD_RECOVERY'
}

export type AuthStatus = AuthStatusEnum;