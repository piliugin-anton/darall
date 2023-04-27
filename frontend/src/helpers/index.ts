import { ValidationError } from 'express-validator'

export function debounce(func: Function, timeout = 300): Function {
    let timer: any
    return (...args: any[]) => {
        clearTimeout(timer)
        timer = setTimeout(() => {
            func.call(this, args)
        }, timeout)
    };
}

export const getCaretPosition = (element: HTMLElement): number => {
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

export const setCaretPosition = (el: HTMLElement, pos: number): number => {
    // Loop through all child nodes
    for (const node of el.childNodes) {
        if (node.nodeType == Node.TEXT_NODE) { // we have a text node
            if (node.length >= pos) {
                // finally add our range
                const range = document.createRange(), sel = window.getSelection()
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

export const errorsList = (errors: string[] | ValidationError[]) => 
    errors.map((error: string | ValidationError) => typeof error === 'string' ? error : `${error.path}' в ${error.location}: ${error.msg}`)

export const numberWithSpaces = (x: number) => {
    const parts = x.toString().split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    return parts.join('.')
}
