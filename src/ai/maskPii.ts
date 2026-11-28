
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

const PHONE_PATTERN = /(^|[^\w])(\+?\d[\d\s().-]{7,}\d)(?=$|[^\w])/g;

export function maskPii(value: string): string {
    const maskedEmail = value.replace(EMAIL_PATTERN, "[EMAIL REDACTED]");

    return maskedEmail.replace(
        PHONE_PATTERN,
        (match, prefix: string, phone: string) => {
            const digits = phone.replace(/\D/g, "");
            const isIndianMobile =
                digits.length === 10 && /^[6-9]/.test(digits);
            const isInternational =
                phone.trim().startsWith("+") &&
                digits.length >= 10 &&
                digits.length <= 15;

            return isIndianMobile || isInternational
                ? `${prefix}[PHONE REDACTED]`
                : match;
        }
    );
}
