# JBValidation
standard validation module standard

## installation 
```bash

    npm install jb-validation

```
## getting started

in every web-component that support jb-validation as a validation method you must follow 3 step
1- provide a validation list(contain validator and message)    
2- call check validation method     
3- check the result    
its easy and straight forward like the example:
```js
component.validation.list = [
    {
        validator: /.{3}/g,
        message: 'your value must have at least 3 char'
    },
]
//check validity and get the result
const result = component.validation.checkValidity(true);
//do whatever you want with the result
console.log('isInputValid:',result.isAllValid);
```
## providing validation

there is 2 way to provide a validation to the module
1- provide a  validation list directly by an array of validator
```js
component.validation.list = [
    {
        validator: /.{3}/g,
        message: 'your value must have at least 3 char'
    },
]
```
2- register a function that return validation list:
```js
const getValidations = ()=>{
    return [
        {
            validator: /.{3}/g,
            message: 'your value must have at least 3 char'
        },
    ]
}
component.validation.addValidationListGetter(getValidations);
```
in the second method getValidations will be called on each validation check so if you have a complex validation logic that may change base on your app states or component states it's better to use second way to make sure everything is controlled.    
remember both way can be used together and you can even add multiple `ValidationListGetter` in more complex situations.

## validators

validations in jb-validation follow this typescript type:
```typescript
//TValue will be different base on the implementor component
export type ValidationItem<ValidationValue> = {
    validator: RegExp | ((value:ValidationValue)=>boolean|string);
    message:string;
    stateType?: keyof ValidityStateFlags
}
```
it means you can pass a regex or function as a validator and there is a optional [stateType](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState) that indicate which standard has been violated.    
### function validator

function validator have many benefits one of them is that they may be defined in a scope that contain your app states and variables (like in react components or hooks or angular class). it means that you can access your own app variables and write a logic in your function base on your need. for example:
```js
    function setValidations(validStudentList = []){}
        component.validation.list = [{
            validator: (student)=>validStudentList.includes(student),
            message: 'this student is not in our valid student list'
        }]
```
the other benefits is that you can have very complex logic for your input because its just a plain function and if you return `string` instead of `boolean` we assume it as an Error message and show it to the user.

```js
function setValidations(blackList = []){}
        component.validation.list = [{
            validator: (studentName)=>{
                if(blackList.includes(studentName)){
                    return `${studentName} is in the black list try someone else`
                }
                return true
            },
            message: 'this message will shown if you return false'
    }]
```

## implement in new a web-component

