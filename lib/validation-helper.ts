import type { ValidationItem, ValidationResult, ValidationResultSummary, GetValidationsCallback, Callbacks, CallbacksInput, checkValidityParameters } from "./types";
import { checkValueValidationSync, checkValueValidationAsync } from "./utils.js";

export class ValidationHelper<ValidationValue> {
  //states
  #list: ValidationItem<ValidationValue>[] = [];
  #resultSummary?: ValidationResultSummary = {
    isValid: null,
    message: null,
  };
  get resultSummary() {
    return this.#resultSummary;
  }
  result: ValidationResult<ValidationValue> | null = null;
  #callbacks: Callbacks<ValidationValue> = {
    clearValidationError: [],
    getValue: () => {
      return null as ValidationValue;
    },
    getValidations: [],
    getValueString: () => "",
    setValidationResult: [],
    showValidationError: [],
  }
  get #allValidationList(){
    const insideValidations = this.#getInsideValidationList();
    return[...insideValidations, ...this.#list];
  }
  constructor(callbacks: CallbacksInput<ValidationValue>) {
    this.setCallbacks(callbacks);
  }
  setCallbacks(callbacks: CallbacksInput<ValidationValue>) {
    type CallbackKey = keyof CallbacksInput<ValidationValue>;
    type CallbackInput = NonNullable<CallbacksInput<ValidationValue>[CallbackKey]>;
    type CallbackBucket = CallbackInput | CallbackInput[];
    const registeredCallbacks = this.#callbacks as Record<CallbackKey, CallbackBucket>;
    const keys = Object.keys(callbacks) as CallbackKey[];
    //extract callbacks name and push the to module callbacks list
    keys.forEach((key) => {
      const callback = callbacks[key] as CallbackInput | undefined;
      const registeredCallback = registeredCallbacks[key];
      if (typeof callback == "function" && registeredCallback !== undefined) {
        if (Array.isArray(registeredCallback)) {
          registeredCallback.push(callback);
        } else {
          registeredCallbacks[key] = callback;
        }
      }
    });

  }
  get list(): ValidationItem<ValidationValue>[] {
    return this.#list;
  }
  set list(value: ValidationItem<ValidationValue>[]) {
    this.#list = value;
    this.checkValidity({ showError: false });
  }
  /**
   * @description check if input validation list is fulfilled or not
   */
  async checkValidity(parameters?: checkValidityParameters<ValidationValue>): Promise<ValidationResult<ValidationValue>> {
    // this method is for use out of component  for example if user click on submit button and developer want to check if all fields are valid
    //takeAction determine if we want to show user error in web component default Manner or developer will handle it by himself
    const inputValue = parameters?.value || await Promise.resolve(this.#callbacks.getValue());
    const validationResult = await this.#checkValueValidation(inputValue);
    this.#doCheckValidationAction(validationResult,parameters);
    return validationResult;
  }
  /**
 * @description check if input validation list is fulfilled or not but will ignore async validations callbacks.
 */
  checkValiditySync(input?: checkValidityParameters<ValidationValue>): ValidationResult<ValidationValue> {
    // this method is for use out of component  for example if user click on submit button and developer want to check if all fields are valid
    //takeAction determine if we want to show user error in web component default Manner or developer will handle it by himself
    const inputValue = input?.value || this.#callbacks.getValue() as ValidationValue;
    const validationResult = this.#checkValueValidationSync(inputValue);
    this.#doCheckValidationAction(validationResult,input);
    return validationResult;
  }
  /**
   * get validation result and user action config and Act base on result and config.
   */
  #doCheckValidationAction(validationResult: ValidationResult<ValidationValue>, input?: checkValidityParameters<ValidationValue>) {
    this.#resultSummary = {
      isValid: validationResult.isAllValid,
      message: null,
    };
    if (!validationResult.isAllValid) {
      const firstFault = validationResult.validationList.find(
        (x) => !x.isValid
      )!;
      this.#resultSummary.message = firstFault.message;
      if (input?.showError !== false) {
        this.#callbacks.showValidationError.forEach(fn =>{ fn({ message: firstFault.message! })});
      }
    } else {
      //if all thing were valid
      this.#callbacks.clearValidationError.forEach(fn => {fn()});
    }
    this.result = validationResult;
    //set result for 
    this.#callbacks.setValidationResult.forEach(fn => {fn(validationResult)});
  }
  /**
   * @description this function will register a function as validation getter sp on each validation check it will call getter function and check it's returned validation
   * @public
   */
  addValidationListGetter(func: GetValidationsCallback<ValidationValue>) {
    this.#callbacks.getValidations.push(func);
  }
  #getInsideValidationList() {
    const insideValidations: ValidationItem<ValidationValue>[] = [];
    this.#callbacks.getValidations.forEach((getValidation) => {
      if (typeof getValidation == "function") {
        insideValidations.push(...getValidation());
      }
    });
    return insideValidations.flat();
  }
  /**
   *@description compare value with all validation
   */
  async #checkValueValidation(value: ValidationValue): Promise<ValidationResult<ValidationValue>> {
    return await checkValueValidationAsync(this.#allValidationList, value, this.#callbacks.getValueString);
  }
  /**
  *@description compare value with all sync validations
  */
  #checkValueValidationSync(value: ValidationValue): ValidationResult<ValidationValue> {
    return checkValueValidationSync(this.#allValidationList, value, this.#callbacks.getValueString);
  }
}
