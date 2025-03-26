import { GetValueStringCallback, ValidationItem, ValidationResult, ValidationResultItem, ValidatorFunction } from "./types";

/**
 * @description check sync validations of value  (will ignore async validations)
 * @param list list of validation
 * @param value the value you want to check it's validation
 * @param getValueString function that return value in string
 */
export function checkValueValidationSync<ValidationValue>(list: ValidationItem<ValidationValue>[], value: ValidationValue, getValueString: GetValueStringCallback<ValidationValue>) {
  const {syncValidationResult} = checkValueValidation(list,value,getValueString);
  return syncValidationResult;
}
/**
 * @description check validations of value 
 * @param list list of validation
 * @param value the value you want to check it's validation
 * @param getValueString function that return value in string
 */
export async function checkValueValidationAsync<ValidationValue>(list: ValidationItem<ValidationValue>[], value: ValidationValue, getValueString: GetValueStringCallback<ValidationValue>) {
  const {syncValidationResult:result,asyncList} = checkValueValidation(list,value,getValueString);
  for(const item of asyncList){
    const res = await item;
    result.isAllValid = result.isAllValid && res.isValid;
    result.validationList.push(res);
  }
  return result;
}

export function checkValueValidation<ValidationValue>(list: ValidationItem<ValidationValue>[], value: ValidationValue, getValueString: GetValueStringCallback<ValidationValue>) {
  const syncValidationResult: ValidationResult<ValidationValue> = {
    validationList: [],
    isAllValid: true,
  };
  const stackRes = (res:ValidationResultItem<ValidationValue>)=>{
    syncValidationResult.validationList.push(res);
    if (!res.isValid) {
      syncValidationResult.isAllValid = false;
    }
  };
  const deferredList = list.filter(x=>x.defer === true);
  const earlyList = list.filter(x=>x.defer !==true);
  const asyncList:Promise<ValidationResultItem<ValidationValue>>[] = [];
  for (const validation of earlyList) {
    const res =checkValidation(value, validation, getValueString);
    if(res instanceof Promise){
      asyncList.push(res);
    }else{
      stackRes(res);
    }
  }
  if(syncValidationResult.isAllValid){
    //we only execute defer validation when all non defers were valid
    for (const validation of deferredList) {
      const res =checkValidation(value, validation, getValueString);
      if(res instanceof Promise){
        asyncList.push(res);
      }else{
        stackRes(res);
      }
    }
  }
  //
  return {syncValidationResult, asyncList};
}

/**
 * @description check single validation item
 */
export function checkValidation<ValidationValue>(value: ValidationValue, validation: ValidationItem<ValidationValue>, getValueString: GetValueStringCallback<ValidationValue>): Promise<ValidationResultItem<ValidationValue>> | ValidationResultItem<ValidationValue> {
  let testRes: boolean;
  let message = validation.message;
  if (validation.validator instanceof RegExp) {
    const text = typeof value == "string" ? value : getValueString(value);
    testRes = validation.validator.test(text);
    validation.validator.lastIndex = 0;
  }

  if (typeof validation.validator == "function") {
    const res = checkValidator(validation.validator, value);
    // if our validator were async we return promise
    if (res instanceof Promise) {
      return new Promise<ValidationResultItem<ValidationValue>>((resolve) => {
        res.then((promRes) => {
          resolve({
            isValid: promRes.isValid,
            message: promRes.message,
            validation
          });
        });
      });
    }
    testRes = res.isValid;
    message = res.message ?? message;
  }
  if(validation.validator === undefined){
    testRes = false;
  }
  if (!testRes) {
    return {
      isValid: false,
      message: message,
      validation: validation,
    };
  }
  return {
    isValid: true,
    message: "",
    validation: validation,
  };
}

type checkValidatorFunctionRes = { isValid: boolean, message: string }
/**
 * 
 * @param validator validator function
 * @param value the value you want to send to validator
 * @returns 
 */
export function checkValidator<ValidationValue>(validator: ValidatorFunction<ValidationValue>, value: ValidationValue): Promise<checkValidatorFunctionRes> | checkValidatorFunctionRes {
  function createResponse(res: string | boolean): checkValidatorFunctionRes {
    let message: string | null = null;
    if (typeof res == "string" && res.length > 0) {
      message = res;
    }
    //if function return string if string was full it mean we must show custom error
    const isValid = typeof res == "string" ? res.length == 0 : res;
    return { isValid, message };
  }

  const funcRes = validator(value);
  if (funcRes instanceof Promise) {
    return new Promise<checkValidatorFunctionRes>((resolve) => {
      funcRes.then((res) => {
        resolve(createResponse(res));
      });
    });
  } else {
    return createResponse(funcRes);
  }
}