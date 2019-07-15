import { ValidatorObject, Hooks } from './middleware';

declare module 'koa' {
    interface Context {
        validationErrors: { [key: string]: string };
        validateBody(setup: ValidatorObject, hooks?: Hooks): void;
        validateParams(setup: ValidatorObject, hooks?: Hooks): void;
        validateQuery(setup: ValidatorObject, hooks?: Hooks): void;
        validateHeaders(setup: ValidatorObject, hooks?: Hooks): void;
    }
}

export { middleware as validation } from './middleware';
export {
    validatorBuilder as v,
    addCustom as addCustomValidator,
    Validators as IValidators,
} from './validator-builder';
export {
    filterBuilder as f,
    addCustom as addCustomFilter,
    Filter as IFilters,
} from './filter-builder';
export { exists } from './helpers';
