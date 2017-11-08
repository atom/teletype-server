module.exports =
function condition (fn) {
  const timeoutError = new Error('Condition timed out: ' + fn.toString())
  Error.captureStackTrace(timeoutError, condition)

  return new Promise((resolve, reject) => {
    let verifyConditionTimeoutId

    const abortConditionTimeoutId = global.setTimeout(() => {
      global.clearTimeout(verifyConditionTimeoutId)
      reject(timeoutError)
    }, 500)

    const verifyCondition = async function () {
      if (await fn()) {
        global.clearTimeout(abortConditionTimeoutId)
        resolve()
      } else {
        verifyConditionTimeoutId = global.setTimeout(verifyCondition, 5)
      }
    }

    verifyCondition()
  })
}
