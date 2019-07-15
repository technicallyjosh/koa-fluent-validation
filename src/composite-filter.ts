import { Filter, applyFilter } from './filter-builder';

export default class CompositeFilter implements Filter {
    public args = [];
    private f1: Filter;
    private f2: Filter;

    public constructor(f1: Filter, f2: Filter) {
        this.f1 = f1;
        this.f2 = f2;
    }

    public fn(val: string) {
        return applyFilter(this.f1, applyFilter(this.f2, val));
    }
}
