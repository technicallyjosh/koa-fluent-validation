# koa-fluent-validation

**THIS IS NOT PUBLISHED YET AND IS A WORK IN PROGRESS**

Fluent, functional, and extendable validation for Koa 2 body, params, and query. Built on [validator](https://github.com/chriso/validator.js/) for base validations and filters.

**This only works for Koa 2 and Node v7.6+**

## Usage
This is built with TypeScript targeting ECMA 2017 as the output. You will get type definitions when using with TypeScript and of course you can use vanilla JavaScript.

Map files are included so you can debug if you are using VS Code or similar for TypeScript debugging.

For a more common implementation, all examples will be in JavaScript.

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

    ctx.validateBody({
        firstName: v().required().string(),
        lastName: v().required().string()
    });

    // it passed! do something here
});

app.listen(8080);
```
## Koa Context Functions/Properties
Each context function is added to the Koa 2 context and is available in routes and middleware for any request.

* A bodyparser is **required** to use `validateBody()`. If you aren't using one, I suggest using [koa-bodyparser](https://github.com/koajs/bodyparser).

* A router is **required** to use `validateParams()`. If you aren't using one, I suggest using [koa-router](https://github.com/alexmingoia/koa-router).

#### `validateBody(validatorSetup: Object, filterSetup: Object)`
Validates the incoming body based on the structure and validators given.

```js
ctx.validateBody({
    firstName: v().required()
});
```

#### `validateParams(validatorSetup: Object, filterSetup: Object)`
Validates the incoming parameters based on the structure and validators given.

```js
ctx.validateParams({
    firstName: v().required()
});
```

#### `validateQuery(validatorSetup: Object, filterSetup: Object)`
Validates the incoming query string values based on the structure and validators given.

```js
ctx.validateQuery({
    firstName: v().required()
});
```

#### `validationErrors`
This is a variable that is set in the event of a failed validation. It is an object that contains keys and messages for the values that failed validation.

**Example**
```js
{
    firstName: 'Value is required.'
}
```

## Validators
Validators are methods that validate the incoming value structure from the body, params, or query *before* and/or *after* the validators are called.

### Example
```js
const { v } = require('koa-fluent-validation');

app.use(async ctx => {
    if (ctx.method !== 'POST') {
        ctx.throw(404);
        return;
    }

    ctx.validateBody({
        firstName: v().required().string(),
        lastName: v().required().string()
    });
});
```

### API
The beginning of any validation chain. It's a function that returns an instance of the `ValidatorBuilder` class. Each function that is called on this instance returns the same type.

```js
// v is a function ready to give you a builder to work off of.
const { v } = require('koa-fluent-validation');
```

#### `required()`
Requires the value.

#### `requiredIf(path: string, predicate: Function)`
Requires the value if the predicate returns true. Predicate requires a value to check against.

```js
// lastName is required if the value of firstName is 'John'
ctx.validateBody({
    firstName: v().string(),
    lastName: v().requiredIf('firstName', (value) => value === 'John')
});
```

#### `requiredNotIf(path: string, predicate: Function)`
The opposite of `requiredIf()`.

#### `string()`
The value should be a string.

#### `email([options: Object])`
See [validator](https://github.com/chriso/validator.js) for `options`.

#### `uuid([version: number])`
The value should be a UUID. The `version` defaults to 4.

#### `number()`
The value should be a number.

#### `float([options: Object])`
The value should be a float. See [validator](https://github.com/chriso/validator.js) for `options`.

#### `currency([options])`
The value should be currency. See [validator](https://github.com/chriso/validator.js) for `options`.

#### `int([options])`
The value should be an int. See [validator](https://github.com/chriso/validator.js) for `options`.

#### `length(min: number[, max: number])`
The value should be a minimum of `min` and a maximum of `max`. 

`min` defaults to 1.

#### `base64()`
The value should be a base64 string.

#### `boolean()`
The value should be able to parse to a boolean. e.g: `true`, `false`, `1`, `0`.

*Keep in mind that anything > 0 is true and anything <= 0 is false.*

#### `in(values: [])`
The value should be one of the values specified.

```js
// if firstName exists in body, it must be 'John', 'Sally', or 'Tim'
ctx.validateBody({
    firstName: v().in(['John', 'Sally', 'Tim'])
})
```

#### `url([options: Object])`
The value should be a valid URL. See [validator](https://github.com/chriso/validator.js) for `options`.

#### `contains(seed: string)`
The value should contain `seed`.

<!-- ## Filters
Filters are methods that manipulate the incoming value structure from the body, params, or query *before* or *after* the validators are called.

### Example

```js
const { v, f } = require('koa-fluent-validation');

app.use(async ctx => {
    if (ctx.method !== 'POST') {
        ctx.throw(404);
        return;
    }

    ctx.validateBody({
        firstName: v().required().string(),
        lastName: v().required().string()
    }, {
        before: {
            firstName: f().trim(),
            lastName: f().trim()
        },
        after: {
            firstName: f().upper(),
            lastName: f().upper()
        }
    });
});
```

### API
The beginning of any filter chain. It's a function that returns an instance of the `FilterBuilder` class. Each function that is called on this instance returns the same type.

*This is identical to the `ValidatorBuilder` in usage.*
 -->
