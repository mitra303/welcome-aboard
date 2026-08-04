export interface WelcomeCardData {
  employeeName: string;
  designation: string;
  department: string;
  reportingManager: string;
  officeLocation: string;
  qualification: string;
  university: string;
  bio?: string;
  birthday: string; // YYYY-MM-DD
  officialEmail: string;
  gender?: 'male' | 'female';
}

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatBirthday(birthday: string) {
  if (!birthday) return '';
  const d = new Date(birthday + 'T00:00:00');
  if (isNaN(d.getTime())) return birthday;
  const day = ordinal(d.getDate());
  const month = d.toLocaleString('en-US', { month: 'long' });
  return `${day} ${month}`;
}

function escapeHtml(str: string) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[c];
  });
}

const LOGO_URL = 'https://miplapp.in/images/Mitra_logo.png';
const FONT_STACK = `'Exo', Arial, Helvetica, sans-serif`;
const EXO_LINK = `<link href="https://fonts.googleapis.com/css2?family=Exo:wght@400;600;700;800&display=swap" rel="stylesheet" type="text/css">`;
const EXO_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Exo:wght@400;600;700;800&display=swap');`;

export function getWelcomeCardHtml(
  data: WelcomeCardData,
  imageSrc: string,
  iconBaseUrl: string
) {
  const isFemale = data.gender === 'female';
  const title = isFemale ? 'Ms.' : 'Mr.';
  const pronounObject = isFemale ? 'her' : 'him';
  const pronounPossessive = isFemale ? 'her' : 'his';

  const name = escapeHtml(data.employeeName);
  const firstName = escapeHtml(data.employeeName.trim().split(/\s+/)[0] || data.employeeName);
  const designation = escapeHtml(data.designation);
  const department = escapeHtml(data.department);
  const manager = escapeHtml(data.reportingManager);
  const location = escapeHtml(data.officeLocation);
  const qualification = escapeHtml(data.qualification);
  const university = escapeHtml(data.university);
  const email = escapeHtml(data.officialEmail);
  const birthdayStr = formatBirthday(data.birthday);

  const textColor = '#3A6B9A';
  const headingColor = '#1B5E9A';

  const mailIconUrl = 'https://miplapp.in/images/email.png';

  return `${EXO_LINK}
  <style>${EXO_IMPORT}
  body,table,td,p,a,span,div{font-family:${FONT_STACK}!important;}
  </style>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 0;font-family:${FONT_STACK};">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" style="background:#ffffff;border:9px solid ${headingColor};max-width:900px;width:100%;">
          <tr>
            <td style="padding:28px 40px 0 40px;">
              <img src="${LOGO_URL}" alt="MITRA" height="48" style="display:block;height:48px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 4px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" width="220" style="text-align:center;padding-right:28px;">
                    <img src="${imageSrc}" alt="${name}" width="220" height="260" style="width:220px;height:260px;object-fit:cover;border-radius:8px;display:block;margin:0 auto 12px auto;" />
                    <div style="font-weight:700;color:${headingColor};font-size:22px;text-align:center;font-family:${FONT_STACK};">${title} ${name}</div>
                  </td>
                  <td valign="middle">
                    <p style="margin:0 0 18px 0;color:${textColor};font-size:19px;line-height:1.5;font-family:${FONT_STACK};">
                      We are pleased to announce that <strong>${title} ${name}</strong> has joined <strong>Mitra Industries</strong> as <strong>${designation} &ndash; ${department}</strong>.
                    </p>
                    <p style="margin:0 0 18px 0;color:${textColor};font-size:19px;line-height:1.5;font-family:${FONT_STACK};">
                      <strong>${title} ${firstName}</strong> will be based in <strong>${location}</strong> and will report to <strong>${manager} &ndash; ${department}</strong>.
                    </p>
                    <p style="margin:0 0 18px 0;color:${textColor};font-size:19px;line-height:1.5;font-family:${FONT_STACK};">
                      <strong>${title} ${firstName}</strong> holds a <strong>${qualification} in ${university}</strong>.
                    </p>
                    <p style="margin:0 0 20px 0;color:${textColor};font-size:19px;line-height:1.5;font-family:${FONT_STACK};">
                      <strong>Birthday:</strong> ${birthdayStr}
                    </p>
                    <p style="margin:0;color:${headingColor};font-size:19px;font-family:${FONT_STACK};">
                      Please join us in extending a warm welcome to <strong>${title} ${name}</strong> and wish ${pronounObject} every success in ${pronounPossessive} new role at <strong>Mitra Industries</strong>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px 24px 40px;">
<table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" style="padding-right:10px;"><img src="${mailIconUrl}" alt="" width="24" height="24" style="display:block;" /></td>
                  <td valign="middle" style="color:${headingColor};font-size:18px;white-space:nowrap;font-family:${FONT_STACK};">${email}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <p style="margin:0;color:${headingColor};font-size:19px;font-weight:700;font-family:${FONT_STACK};">A Warm Welcome to the Mitra Family!</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

export { formatBirthday };

export function getNameTitle(gender?: 'male' | 'female') {
  return gender === 'female' ? 'Ms.' : 'Mr.';
}
