import { ValidationItem, ValidationResult, ValidationResultSummary, GetInsideValidationsCallback, Callbacks, CallbacksInput, checkValidityInput } from "./types";
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
    getInputtedValue: () => null,
    getInsideValidations: [],
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
    const keys = Object.keys(callbacks) as unknown as (keyof CallbacksInput<ValidationValue>)[];
    keys.forEach((key) => {
      if (typeof callbacks[key] == "function" && this.#callbacks[key] !== undefined) {
        if (Array.isArray(this.#callbacks[key])) {
          //@ts-ignore
          this.#callbacks[key].push(callbacks[key]);
        } else {
          //@ts-ignore
          this.#callbacks[key] = callbacks[key];
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
  async checkValidity(input: checkValidityInput<ValidationValue>): Promise<ValidationResult<ValidationValue>> {
    // this method is for use out of component  for example if user click on submit button and developer want to check if all fields are valid
    //takeAction determine if we want to show user error in web component default Manner or developer will handle it by himself
    const inputValue = input.value || await Promise.resolve(this.#callbacks.getInputtedValue());
    const validationResult = await this.#checkValueValidation(inputValue);
    this.#doCheckValidationAction(validationResult,input);
    return validationResult;
  }
  /**
 * @description check if input validation list is fulfilled or not but will ignore async validations callbacks.
 */
  checkValiditySync(input: checkValidityInput<ValidationValue>): ValidationResult<ValidationValue> {
    // this method is for use out of component  for example if user click on submit button and developer want to check if all fields are valid
    //takeAction determine if we want to show user error in web component default Manner or developer will handle it by himself
    const inputValue = input.value || this.#callbacks.getInputtedValue() as ValidationValue;
    const validationResult = this.#checkValueValidationSync(inputValue);
    this.#doCheckValidationAction(validationResult,input);
    return validationResult;
  }
  #doCheckValidationAction(validationResult: ValidationResult<ValidationValue>, input: checkValidityInput<ValidationValue>) {
    this.#resultSummary = {
      isValid: validationResult.isAllValid,
      message: null,
    };
    if (!validationResult.isAllValid) {
      const firstFault = validationResult.validationList.find(
        (x) => !x.isValid
      )!;
      this.resultSummary.message = firstFault.message;
      if (input.showError !== false) {
        this.#callbacks.showValidationError.forEach(fn => fn({ message: firstFault.message! }));
      }
    } else {
      //if all thing were valid
      this.#callbacks.clearValidationError.forEach(fn => fn());
    }
    this.result = validationResult;
    //set result for 
    this.#callbacks.setValidationResult.forEach(fn => fn(validationResult));
  }
  /**
   * @description this function will register a function as validation getter sp on each validation check it will call getter function and check it's returned validation
   * @public
   */
  addValidationListGetter(func: GetInsideValidationsCallback<ValidationValue>) {
    this.#callbacks.getInsideValidations.push(func);
  }
  #getInsideValidationList() {
    const insideValidations: ValidationItem<ValidationValue>[] = [];
    this.#callbacks.getInsideValidations.forEach((getValidation) => {
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
