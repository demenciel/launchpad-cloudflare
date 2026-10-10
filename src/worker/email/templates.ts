export type EmailTemplate = {
	subject: string;
	html: string;
	text: string;
};

export function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (character) => {
		const entities: Record<string, string> = {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			'"': "&quot;",
			"'": "&#39;",
		};
		return entities[character];
	});
}

function safeLink(value: string): string {
	const url = new URL(value);
	if (url.protocol !== "https:" && url.protocol !== "http:") {
		throw new Error("Email links must use HTTP or HTTPS.");
	}
	return escapeHtml(url.href);
}

/** Shared, inline-styled layout for transactional emails. */
export function emailLayout({
	appName,
	preview,
	heading,
	message,
	action,
}: {
	appName: string;
	preview: string;
	heading: string;
	message: string;
	action?: { label: string; url: string };
}): EmailTemplate {
	const actionHtml = action
		? `<p style="margin:28px 0"><a href="${safeLink(action.url)}" style="background:#18181b;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">${escapeHtml(action.label)}</a></p>`
		: "";
	return {
		subject: heading,
		html: `<!doctype html><html lang="en"><body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preview)}</div><main style="max-width:560px;margin:40px auto;padding:32px;background:#fff;border-radius:12px"><p style="font-size:14px;color:#71717a">${escapeHtml(appName)}</p><h1 style="font-size:24px">${escapeHtml(heading)}</h1><p style="line-height:1.7;white-space:pre-line">${escapeHtml(message)}</p>${actionHtml}<p style="font-size:12px;color:#71717a">Sent by ${escapeHtml(appName)}.</p></main></body></html>`,
		text: `${appName}\n\n${heading}\n\n${message}${action ? `\n\n${action.label}: ${new URL(action.url).href}` : ""}`,
	};
}

export function welcomeEmail({
	name,
	appName,
	appUrl,
}: {
	name: string;
	appName: string;
	appUrl: string;
}): EmailTemplate {
	return emailLayout({
		appName,
		preview: `Your ${appName} account is ready.`,
		heading: `Welcome to ${appName}`,
		message: `Hi ${name || "there"},\n\nThanks for joining ${appName}. Your account is ready — explore your workspace and create something great.`,
		action: { label: "Open your workspace", url: appUrl },
	});
}

export function notificationEmail({
	appName,
	heading,
	message,
	action,
}: {
	appName: string;
	heading: string;
	message: string;
	action?: { label: string; url: string };
}): EmailTemplate {
	return emailLayout({ appName, preview: heading, heading, message, action });
}
