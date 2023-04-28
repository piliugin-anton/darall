import type { FieldValidationError } from '../../../node_modules/express-validator'

export function debounce(this: Function | void, func: Function, timeout = 300): Function {
    let timer: any
    return (...args: any[]) => {
        clearTimeout(timer)
        timer = setTimeout(() => {
            func.call(this, args)
        }, timeout)
    };
}

export const getCaretPosition = (element: any): number => {
    let caretOffset = 0
    const doc = element.ownerDocument || element.document
    const win = doc.defaultView || doc.parentWindow
    let sel
    if (typeof win.getSelection != 'undefined') {
      sel = win.getSelection()

      if (sel.rangeCount > 0) {
        const range = win.getSelection().getRangeAt(0)
        const preCaretRange = range.cloneRange()
        preCaretRange.selectNodeContents(element)
        preCaretRange.setEnd(range.endContainer, range.endOffset)
        caretOffset = preCaretRange.toString().length
      }
    } else if ((sel = doc.selection) && sel.type != 'Control') {
      const textRange = sel.createRange()
      const preCaretTextRange = doc.body.createTextRange()
      preCaretTextRange.moveToElementText(element)
      preCaretTextRange.setEndPoint('EndToEnd', textRange)
      caretOffset = preCaretTextRange.text.length
    }

    return caretOffset
}

export const setCaretPosition = (el: any, pos: number): number => {
    const doc = el.ownerDocument || el.document
    const win = doc.defaultView || doc.parentWindow
    // Loop through all child nodes
    for (const node of el.childNodes) {
        if (node.nodeType == Node.TEXT_NODE) { // we have a text node
            if (node.length >= pos) {
                // finally add our range
                const range = doc.createRange(), sel = win.getSelection()
                range.setStart(node, pos)
                range.collapse(true)
                sel.removeAllRanges()
                sel.addRange(range)
                return -1
            } else {
                pos -= node.length
            }
        } else {
            pos = setCaretPosition(node, pos)
            if (pos == -1) return -1 
        }
    }

    return pos
}

export const errorsList = (errors: string[] | FieldValidationError[]) => 
    errors.map((error: string | FieldValidationError) => typeof error === 'string' ? error : `${error.path}' в ${error.location}: ${error.msg}`)

export const numberWithSpaces = (x: number) => {
    const parts = x.toString().split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    return parts.join('.')
}
