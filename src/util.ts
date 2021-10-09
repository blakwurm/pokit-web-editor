export function capFirstLetter(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export function capEveryWord(s: string) {
    return s.split(' ').map(capFirstLetter).join(' ')
}