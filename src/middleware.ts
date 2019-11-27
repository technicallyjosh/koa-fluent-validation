import Koa from 'koa';
import { Validators, ValidatorBuilder } from './validator-builder';
import { Filters, FilterBuilder } from './filter-builder';
import set from 'lodash.set';

export interface ValidatorObject {
  [key: string]: Validators | ValidatorObject;
}

export interface FilterObject {
  [key: string]: Filters | FilterObject;
}

export interface Hooks {
  before?: FilterObject;
  after?: FilterObject;
}

function runValidators(
  ctx: Koa.Context,
  obj: ValidatorObject,
  root: any,
  parent: any,
  parentKey?: string,
) {
  for (const key in obj) {
    const builder = obj[key];
    const value = parent && parent[key];
    const path = parentKey ? `${parentKey}.${key}` : key;

    if (builder instanceof ValidatorBuilder) {
      const error = builder.validate({ obj: root, path, value });

      if (error) {
        ctx.validationErrors[path] = error;
      }

      continue;
    }

    runValidators(ctx, builder as ValidatorObject, root, value, path);
  }

  if (!parentKey) {
    if (Object.keys(ctx.validationErrors).length) {
      ctx.throw(422);
    }
  }
}

function runHooks(
  ctx: Koa.Context,
  obj: FilterObject,
  root: any,
  parent: any,
  parentKey?: string,
) {
  for (const key in obj) {
    const builder = obj[key];
    const value = parent && parent[key];
    const path = parentKey ? `${parentKey}.${key}` : key;

    if (value === undefined) {
      if (builder instanceof FilterBuilder) {
        const newValue = builder.filter(value);

        set(root, path, newValue);
      }

      continue;
    }

    if (builder instanceof FilterBuilder) {
      const newValue = builder.filter(value);

      set(root, path, newValue);

      continue;
    }

    runHooks(ctx, builder as FilterObject, root, value, path);
  }
}

function validate(
  ctx: Koa.Context,
  setup: ValidatorObject,
  obj: any,
  hooks?: Hooks,
) {
  if (
    hooks !== undefined &&
    hooks !== null &&
    hooks.before !== undefined &&
    hooks.before !== null
  ) {
    runHooks(ctx, hooks.before, obj, obj);
  }

  runValidators(ctx, setup, obj, obj);

  if (
    hooks !== undefined &&
    hooks !== null &&
    hooks.after !== undefined &&
    hooks.after !== null
  ) {
    runHooks(ctx, hooks.after, obj, obj);
  }
}

function validateBody(
  this: Koa.Context,
  setup: ValidatorObject,
  hooks?: Hooks,
) {
  if (this.request.body === undefined) {
    throw new Error('ctx.request.body is missing. You must use a body parser.');
  }

  validate(this, setup, this.request.body, hooks);
}

function validateParams(
  this: Koa.Context,
  setup: ValidatorObject,
  hooks?: Hooks,
) {
  if (this.params === undefined) {
    throw new Error('ctx.params is missing. Try using a router.');
  }

  validate(this, setup, this.params, hooks);
}

function validateQuery(
  this: Koa.Context,
  setup: ValidatorObject,
  hooks?: Hooks,
) {
  validate(this, setup, this.query, hooks);
}

function validateHeaders(
  this: Koa.Context,
  setup: ValidatorObject,
  hooks?: Hooks,
) {
  validate(this, setup, this.headers, hooks);
}

export function middleware() {
  return async (ctx: Koa.Context, next: () => Promise<any>) => {
    ctx.validateBody = validateBody;
    ctx.validateParams = validateParams;
    ctx.validateQuery = validateQuery;
    ctx.validateHeaders = validateHeaders;
    ctx.validationErrors = {};

    await next();
  };
}
