import { StressClient } from '../../utils/stressClient';
import { ChatConfig } from './types';
export declare function sumarizeChat(localClients: StressClient[], cfg: ChatConfig): Promise<{
    containerIndex: number;
    processIndex: number;
    freeMemory: string;
    checkinCounts: Record<string, Record<string, number>>;
}>;
//# sourceMappingURL=sumarizeChat.d.ts.map