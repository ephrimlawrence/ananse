export function isMatch(input: any, expected: any): boolean {
	//   if (typeof action.choice == "function") {
	//   const result = await action.choice(input, this.request, this.response);
	//   if (result == input) {
	//     state.action = action;
	//     break;
	//   }
	// }

	if (expected === "*") {
		// Any value is allowed, no need for validation
		return true;
	}

	if (typeof expected === "string" || typeof expected === "number") {
		// biome-ignore lint/suspicious/noDoubleEquals: <no need for strict check here>
		return input == expected;
	}

	try {
		return (expected as RegExp).test(input);
	} catch (e) {
		return false;
	}
}
