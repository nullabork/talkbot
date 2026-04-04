import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

interface StepStats {
    count: number;
    min: number;
    max: number;
    total: number;
}

interface StepOutput {
    count: number;
    min_ms: number;
    max_ms: number;
    avg_ms: number;
}

export class Trace {
    private marks: [string, number][] = [];
    private measure: Measure;

    constructor(measure: Measure) {
        this.measure = measure;
        this.marks.push(['start', performance.now()]);
    }

    mark(name: string): void {
        this.marks.push([name, performance.now()]);
    }

    end(): void {
        this.marks.push(['end', performance.now()]);
        const durations = new Map<string, number>();
        for (let i = 1; i < this.marks.length; i++) {
            const duration = this.marks[i][1] - this.marks[i - 1][1];
            durations.set(this.marks[i][0], duration);
        }
        durations.set('total', this.marks[this.marks.length - 1][1] - this.marks[0][1]);
        this.measure.record(durations);
    }
}

class Measure {
    private static instance: Measure;
    private enabled: boolean;
    private stats: Record<string, StepStats> = {};
    private outputPath: string;

    private constructor() {
        this.enabled = process.env.MEASURE === 'true';
        // Find project root
        let dir = __dirname;
        while (dir !== path.parse(dir).root) {
            if (fs.existsSync(path.join(dir, 'package.json'))) break;
            dir = path.dirname(dir);
        }
        this.outputPath = path.join(dir, 'measure.json');

        // Load existing stats from disk so they survive restarts
        if (this.enabled && fs.existsSync(this.outputPath)) {
            try {
                const saved = JSON.parse(fs.readFileSync(this.outputPath, 'utf-8'));
                for (const [step, data] of Object.entries(saved) as [string, StepOutput][]) {
                    this.stats[step] = {
                        count: data.count,
                        min: data.min_ms,
                        max: data.max_ms,
                        total: data.avg_ms * data.count,
                    };
                }
            } catch {
                // Corrupted file — start fresh
            }
        }
    }

    static getInstance(): Measure {
        if (!Measure.instance) {
            Measure.instance = new Measure();
        }
        return Measure.instance;
    }

    start(): Trace | null {
        if (!this.enabled) return null;
        return new Trace(this);
    }

    record(durations: Map<string, number>): void {
        for (const [step, ms] of durations) {
            if (!this.stats[step]) {
                this.stats[step] = { count: 0, min: Infinity, max: 0, total: 0 };
            }
            const s = this.stats[step];
            s.count++;
            s.min = Math.min(s.min, ms);
            s.max = Math.max(s.max, ms);
            s.total += ms;
        }
        this.flush();
    }

    private flush(): void {
        const output: Record<string, StepOutput> = {};
        for (const [step, s] of Object.entries(this.stats)) {
            output[step] = {
                count: s.count,
                min_ms: Math.round(s.min * 100) / 100,
                max_ms: Math.round(s.max * 100) / 100,
                avg_ms: Math.round((s.total / s.count) * 100) / 100,
            };
        }
        fs.writeFileSync(this.outputPath, JSON.stringify(output, null, 2));
    }
}

module.exports = Measure;
export default Measure;
