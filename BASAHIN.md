# AutoTrain 3D - ADMIN (hiwalay na app)

Ito ay HIWALAY na Nuxt project para sa mga admin. Hindi ito kasama sa student app, at wala itong link sa student app.
Gumagamit ito ng PAREHONG Turso database, kaya ang ilalagay ng admin dito ay makikita sa student app.

HAKBANG 1 (ito): login ng admin + koneksyon sa database. Ang Quiz manager at 3D Tools manager ay susunod.

## Paano patakbuhin sa computer mo

1. I-extract ang zip sa BAGONG folder, sa tabi ng student app mo (HUWAG sa loob ng student app).
2. Buksan ang folder sa VS Code. Sa terminal:

       npm install

   (Aabutin ng ilang minuto sa unang beses.)

3. Kopyahin ang `.env.example` at pangalanan itong `.env`. Punan ang mga ito:

   - `TURSO_DATABASE_URL` at `TURSO_AUTH_TOKEN`: kopyahin sa `.env` ng student app (PAREHO).
   - `ADMIN_EMAIL` at `ADMIN_PASSWORD`: ang email at password ng admin na pipiliin mo (hindi bababa sa 8 na character).
   - `ADMIN_SECRET`: mahabang random na teksto. Para gumawa, sa terminal:

         node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

     Kopyahin ang lalabas. HUWAG gamitin ang parehong halaga ng student app.

4. Patakbuhin:

       npm run dev

5. Buksan ang http://localhost:3001 at mag-login. (Ang student app ay nasa 3000, kaya puwedeng sabay.)

## Ano ang dapat mong makita
- Ang login page na may "ADMIN". Maling password = mensahe ng error.
- Pagkatapos mag-login: Dashboard na may bilang ng mga estudyante. Dapat tugma ito sa totoong bilang ng mga account.
- Ang "Quiz questions" at "3D models" ay may "-" muna. Normal ito sa Hakbang 1.

## Mga tandaan
- Ang unang admin ay gagawin LANG kapag walang admin pa sa database. Pagkatapos nito, hindi na babaguhin ng `.env` ang password.
- Hindi ginagalaw ng admin app ang mga table ng estudyante. Ang ginagawa lang nito ay basahin ang bilang. Gumagawa lang ito ng sarili nitong mga table: `admins`, `admin_sessions`, `admin_limits`.
- Ang `.env` ay HUWAG i-commit sa GitHub. (Nasa `.gitignore` na.)
- 6 na maling tries sa loob ng 15 minuto ay haharangin muna ang email na iyon.
- Ang session ay 8 oras, at nakalagay sa cookie na HttpOnly, Secure (online) at SameSite=Strict.
