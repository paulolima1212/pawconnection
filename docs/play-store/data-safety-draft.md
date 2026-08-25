# Google Play Data safety draft

This is a technical inventory, not a final legal declaration. The app owner must verify the API, storage, backups, logs and every third-party service before submitting the Play Console form.

## Likely collected data

| Play category | Paw Connection examples | Purpose |
|---|---|---|
| Personal info | name or nickname, email, biography and profile | account, authentication and social features |
| Approximate location | city, neighbourhood or reduced coordinates | nearby discovery and feed |
| Precise location | device coordinates | map and distance filters |
| Photos | profile, pet and post images | user-generated content |
| Messages | conversations and reactions | user communication |
| User-generated content | posts, comments and pet profile | social features |
| Account identifiers | internal user ID and authentication token | session security and data association |

## Items requiring confirmation

- All production traffic, including WebSockets and media, is encrypted in transit.
- Whether data is shared with hosting, storage, maps, monitoring, analytics or other providers.
- Which data types are required and which are optional.
- Retention periods for active accounts, deleted accounts, backups and security logs.
- Account deletion (`DELETE /profile/me`) removes the user row and related chat, posts, comments, connections, match records, then attempts to delete stored profile/pet media. Media cleanup failure does not roll back the account delete; it is logged.
- No advertising or analytics SDK is added indirectly to the final AAB.
- The selected target audience is consistent with the app experience and policy.

## Before form submission

1. Inspect the dependency and permission inventory from the final AAB.
2. Compare every answer with the published privacy policy.
3. Verify that runtime permissions are requested in context and denied permissions have a usable fallback.
4. Test in-app and external account-deletion paths.
5. Have the legally responsible publisher approve the final declarations.
