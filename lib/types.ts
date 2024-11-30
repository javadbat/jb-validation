import { type ValidationHelper } from "./validation-helper";

//all web component that has validation will implements this interface
export interface WithValidation<TValidationValue = any> {
    readonly isAutoValidationDisabled: boolean,
    readonly validation: ValidationHelper<TValidationValue>,
    required: boolean,
    validationMessage: string
    showValidationError: ShowValidationErrorCallback,
    clearValidationError: ClearValidationErrorCallback,
    checkValidity: () => boolean
    reportValidity: () => boolean
}

export type ValidationResultSummary = {
    isValid: boolean | null;
    message: string | null;
}
export type ValidationResultItem<ValidationValue> = {
    isValid: boolean | null;
    message: string | null;
    validation: ValidationItem<ValidationValue>;
}
export type ValidationResult<ValidationValue> = {
    validationList: ValidationResultItem<ValidationValue>[];
    isAllValid: boolean;
}
export type ValidatorFunction<ValidationValue> = (value: ValidationValue) => boolean | string | Promise<boolean | string>
//TValue will be different for some inputs like date input
export type ValidationItem<ValidationValue> = {
    /**
     * @property validation function or regex to match value with
     */
    validator: RegExp | ValidatorFunction<ValidationValue>;
        /**
     * @property error message that will be shown if validator return false or regex failed
     */
    message: string;
    /**
     *  @property type of error (category) its optional
     */
    stateType?: keyof ValidityStateFlags;
    /**
     * @property defer validator execution until all non-deferred validation executed.(good for async validator)
     */
    defer?:boolean
}
export type checkValidityInput<ValidationValue> = {
    /**
     * @property showError determine if you want to show error in invalidate state or not. default is true
     */
    showError?: boolean,
        /**
     * @property the value you want to check validation on its optional and if not set it will get from component value)
     */
    value?: ValidationValue
}
//callbacks
export type ShowValidationErrorInput = { message: string }
//
export type ShowValidationErrorCallback = (error: ShowValidationErrorInput | string) => void;
export type ClearValidationErrorCallback = () => void;
export type GetInputtedValueCallback<ValidationValue> = () => (ValidationValue | Promise<ValidationValue>);
export type GetValueStringCallback<ValidationValue> = (value: ValidationValue) => string;
export type GetInsideValidationsCallback<ValidationValue> = () => ValidationItem<ValidationValue>[];
export type SetValidationResultCallback<ValidationValue> = (result: ValidationResult<ValidationValue>) => void;
//
export type Callbacks<ValidationValue> = {
    getInputtedValue: GetInputtedValueCallback<ValidationValue>,
    getValueString: GetValueStringCallback<ValidationValue>,
    showValidationError: ShowValidationErrorCallback[],
    clearValidationError: ClearValidationErrorCallback[],
    getInsideValidations: GetInsideValidationsCallback<ValidationValue>[],
    setValidationResult: SetValidationResultCallback<ValidationValue>[]
}
export type CallbacksInput<ValidationValue> = {
    [key in keyof Callbacks<ValidationValue>]?: Callbacks<ValidationValue>[key] extends Array<any> ? Callbacks<ValidationValue>[key][0] : Callbacks<ValidationValue>[key]
}