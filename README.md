# koa-fluent-validation

[![NPM version][npm-image]][npm-url]

Fluent, functional, and extendable validation for Koa 2 body, params, and query. Built on [validator](https://github.com/chriso/validator.js/) for base validations and filters.

## Installation

```bash
yarn add koa-fluent-validation
# OR
npm i koa-fluent-validation
```

## Requirements

-   NodeJS >= 7.6
-   **For validating parameters, [koa-router](https://github.com/alexmingoia/koa-router)'s implementation is used with `ctx.params`.**

## Usage

### Simple App Example

```js
const Koa = require('koa');
const bodyparser = require('koa-bodyparser');
const { validator, v, f } = require('koa-fluent-validation');

const app = new Koa();

app.use(bodyparser());
app.use(validator());

app.use(async (ctx, next) => {
    try {
        await next();
    } catch (e) {
        if (e.status === 422) {
            ctx.body = ctx.validationErrors;
            return;
        }

        // ... some other handling here etc
    }
});

// simple post route
app.use(async (ctx, next) => {
    if (ctx.method !== 'POST') {
        ctx.throw(404);
        return;
    }

    ctx.validateBody(
        {
            firstName: v()
                .required()
                .string(),
            lastName: v()
                .required()
                .string()
        },
        {
            firstName: f().trim(),
            lastName: f().trim()
        }
    );

    // your code here
});

app.listen(8080);
```

## Documentation

**For documentation see the [wiki](https://github.com/technicallyjosh/koa-fluent-validation/wiki)!**

[npm-url]: https://npmjs.org/package/koa-fluent-validation
[npm-image]: http://img.shields.io/npm/v/koa-fluent-validation.svg?style=plastic

## TODO

-   [] Filter Tests
-   [] Automate build via Travis
