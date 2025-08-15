export function checkPin(opts: { pin: string }) {
	return opts.pin.length === 4;
}

export function fetchBalance() {
	return 100;
}
