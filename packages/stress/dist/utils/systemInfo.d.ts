import { dlogger } from '@river-build/dlog';
export declare function getSystemInfo(): {
    OperatingSystem: string;
    SystemUptime: string;
    TotalMemory: string;
    FreeMemory: string;
    CPUCount: string;
    CPUModel: string;
    CPUSpeed: string;
};
export declare function printSystemInfo(logger: ReturnType<typeof dlogger>): void;
//# sourceMappingURL=systemInfo.d.ts.map