import v from 'validator';
import CompositeFilter from './composite-filter';

export type FilterFn = (val: string, ...args: any[]) => any;

export interface Filter {
    fn: FilterFn;
    args: any[];
}

export interface Filters {
    filter(value: any): any;
    trim(): Filters;
    toUpper(): Filters;
    toLower(): Filters;
    padStart(len: number, fill?: string): Filters;
    padEnd(len: number, fill?: string): Filters;
    normalizeEmail(options?: ValidatorJS.NormalizeEmailOptions): Filters;
    toInt(radix?: number): Filters;
    toBoolean(): Filters;
}

export function applyFilter(f: Filter, value: any): any {
    return f.fn(value, ...f.args);
}

export class FilterBuilder implements Filters {
    private f?: Filter;

    public static defineCustom(name: string, fn: FilterFn) {
        Object.defineProperty(FilterBuilder.prototype, name, {
            value(this: FilterBuilder, ...args: any[]) {
                return this.addFilter(fn, ...args);
            },
        });
    }

    public constructor(f?: Filter) {
        this.f = f;
    }

    private addFilter(fn: FilterFn, ...args: any[]): Filters {
        const filter: Filter = { fn, args };

        if (this.f) {
            return new FilterBuilder(new CompositeFilter(filter, this.f));
        }

        this.f = filter;
        return this;
    }

    public filter(value: any): any {
        if (this.f === undefined) {
            throw new Error('No filters specified!');
        }

        return applyFilter(this.f, value);
    }

    public trim() {
        return this.addFilter((value: any) =>
            typeof value === 'string' ? value.trim() : value,
        );
    }

    public toUpper() {
        return this.addFilter((value: any) =>
            typeof value === 'string' ? value.toUpperCase() : value,
        );
    }

    public toLower() {
        return this.addFilter((value: any) =>
            typeof value === 'string' ? value.toLowerCase() : value,
        );
    }

    public padStart(len: number, fill?: string) {
        return this.addFilter(
            (value: any, len: number, fill: string) =>
                typeof value === 'string' ? value.padStart(len, fill) : value,
            len,
            fill,
        );
    }

    public padEnd(len: number, fill?: string) {
        return this.addFilter(
            (value: any, len: number, fill: string) =>
                typeof value === 'string' ? value.padEnd(len, fill) : value,
            len,
            fill,
        );
    }

    public normalizeEmail(options?: ValidatorJS.NormalizeEmailOptions) {
        return this.addFilter(
            (value: any, options?: ValidatorJS.NormalizeEmailOptions) =>
                (typeof value === 'string' &&
                    v.normalizeEmail(value, options)) ||
                value,
            options,
        );
    }

    public toInt(radix?: number) {
        return this.addFilter(
            (value: any, radix?: number) =>
                typeof value === 'string' ? v.toInt(value, radix) : value,
            radix,
        );
    }

    public toBoolean(strict?: boolean) {
        return this.addFilter(
            (value: any, strict?: boolean) =>
                typeof value === 'string' ||
                typeof value === 'number' ||
                typeof value === 'boolean'
                    ? v.toBoolean(value.toString(), strict)
                    : value,
            strict,
        );
    }
}

export function filterBuilder(): Filters {
    return new FilterBuilder();
}

export function addCustom(name: string, fn: FilterFn) {
    FilterBuilder.defineCustom(name, fn);
}
