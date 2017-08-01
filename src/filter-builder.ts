import * as v from 'validator';

export type FilterFn = (val: string, ...args: any[]) => any;

export interface IFilter {
    fn: FilterFn;
    args: any[];
}

export interface IFilters {
    filter(value: any): any;
    trim(): IFilters;
    toUpper(): IFilters;
    toLower(): IFilters;
    padStart(len: number, fill?: string): IFilters;
    padEnd(len: number, fill?: string): IFilters;
    normalizeEmail(options?: ValidatorJS.NormalizeEmailOptions): IFilters;
    toInt(radix?: number): IFilters;
    toBoolean(): IFilters;
}

function applyFilter(f: IFilter, value: any): any {
    return f.fn(value, ...f.args);
}

class CompositeFilter implements IFilter {
    constructor(private f1: IFilter, private f2: IFilter) {}

    fn(val: string) {
        return applyFilter(this.f1, applyFilter(this.f2, val));
    }

    args = []; // Unused
}

export class FilterBuilder implements IFilters {
    constructor(private f?: IFilter) {}

    private addFilter(fn: FilterFn, ...args: any[]): IFilters {
        const filter: IFilter = { fn, args };

        if (this.f) {
            return new FilterBuilder(new CompositeFilter(filter, this.f));
        }

        this.f = filter;
        return this;
    }

    filter(value: any): any {
        if (this.f === undefined) {
            throw new Error('No filters specified!');
        }

        return applyFilter(this.f, value);
    }

    static defineCustom(name: string, fn: FilterFn) {
        Object.defineProperty(FilterBuilder.prototype, name, {
            value: function(this: FilterBuilder, ...args: any[]) {
                return this.addFilter(fn, ...args);
            }
        });
    }

    trim() {
        return this.addFilter((value: any) => (typeof value === 'string' ? value.trim() : value));
    }

    toUpper() {
        return this.addFilter((value: any) => (typeof value === 'string' ? value.toUpperCase() : value));
    }

    toLower() {
        return this.addFilter((value: any) => (typeof value === 'string' ? value.toLowerCase() : value));
    }

    padStart(len: number, fill?: string) {
        return this.addFilter((value: any, len: number, fill: string) => (typeof value === 'string' ? value.padStart(len, fill) : value), len, fill);
    }

    padEnd(len: number, fill?: string) {
        return this.addFilter((value: any, len: number, fill: string) => (typeof value === 'string' ? value.padEnd(len, fill) : value), len, fill);
    }

    normalizeEmail(options?: ValidatorJS.NormalizeEmailOptions) {
        return this.addFilter(
            (value: any, options?: ValidatorJS.NormalizeEmailOptions) => (typeof value === 'string' && v.normalizeEmail(value, options)) || value,
            options
        );
    }

    toInt(radix?: number) {
        return this.addFilter((value: any, radix?: number) => (typeof value === 'string' ? v.toInt(value, radix) : value), radix);
    }

    toBoolean(strict?: boolean) {
        return this.addFilter(
            (value: any, strict?: boolean) =>
                typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? v.toBoolean(value.toString(), strict) : value,
            strict
        );
    }
}

export function filterBuilder(): IFilters {
    return new FilterBuilder();
}

export function addCustom(name: string, fn: FilterFn) {
    FilterBuilder.defineCustom(name, fn);
}
