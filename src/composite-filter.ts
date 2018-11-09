import { IFilter, applyFilter } from './filter-builder';

export default class CompositeFilter implements IFilter {
    args = [];

    constructor(private f1: IFilter, private f2: IFilter) {}

    fn(val: string) {
        return applyFilter(this.f1, applyFilter(this.f2, val));
    }
}
