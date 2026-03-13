export const debounce = <T extends (...args: any[]) => void>(func: T, delay = 300) => {
  let timer: number | undefined
  return (...args: Parameters<T>) => {
    if (timer) {
      window.clearTimeout(timer)
    }
    timer = window.setTimeout(() => func(...args), delay)
  }
}
