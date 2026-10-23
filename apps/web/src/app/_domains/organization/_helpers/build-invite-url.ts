import { inviteUrl } from "@/app/_constants/routes";
import { getAppUrl } from "@/utils/url/get-app-url";

/** Absolute invitation link. The invitation's uuid is the token. */
export function buildInviteUrl(invitationId: string): string {
  return `${getAppUrl()}${inviteUrl}/${invitationId}`;
}
