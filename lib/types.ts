import { type ValidationHelper } from "./validation-helper";

//all web component that has validation will implements this interface
export interface WithValidation<TValidationValue = any> {
    readonly isAutoValidationDisabled:boolean,
    readonly validation :ValidationHelper<TValidationValue>,
    required:boolean,
    validationMessage:string
    showValidationError:ShowValidationErrorCallback,
    clearValidationError:ClearValidationErrorCallback,
    checkValidity:()=>boolean
    reportValidity:()=>boolean
}

export type ValidationResultSummary = {
    isValid:boolean | null;
    message:string | null;
}
export type ValidationResultItem<ValidationValue> = {
    isValid:boolean | null;
    message:string | null;
    validation:ValidationItem<ValidationValue>;
}
export type ValidationResult<ValidationValue> = {
    validationList:ValidationResultItem<ValidationValue>[];
    isAllValid:boolean;
}
//TValue will be different for some inputs like date input
export type ValidationItem<ValidationValue> = {
    validator: RegExp | ((value:ValidationValue)=>boolean|string);
    message:string;
    stateType?: keyof ValidityStateFlags
}
export type ShowValidationErrorCallback = (message:string)=>void;
export type ClearValidationErrorCallback = ()=>void;
export type GetInputtedValueCallback<ValidationValue> = ()=>ValidationValue;
export type GetValueStringCallback<ValidationValue> = (value:ValidationValue)=>string;
export type GetInsideValidationsCallback<ValidationValue> = ()=>ValidationItem<ValidationValue>[];
export type SetValidationResultCallback<ValidationValue> = (result:ValidationResult<ValidationValue>)=>void;