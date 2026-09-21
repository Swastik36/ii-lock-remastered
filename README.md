## Preview

https://github.com/user-attachments/assets/3e7e0cf9-1694-4e61-8da1-d63baaad3b9f

# ii-lock remastered

A Material-style login/lock theme for [Nody Greeter](https://github.com/Pandemonium1986/nody-greeter) (LightDM web greeter). Remastered from [ii-lock-greeter](https://github.com/Swastik36/ii-lock-greeter) with animated polish.

## Features

- **Entrance animation** — a lock icon spins 180° from inverted on load, then the three cards rise in with a staggered fade
- **Outro animation** — on successful login the cards fade out fast while an open-lock spins over a blurred backdrop
- **Analog clock** — Material-style scalloped face, day/month bubbles, digital overlay, and a continuously sweeping second hand (requestAnimationFrame, wrap-free)
- **Signature password pill** — each typed character shows a filled Material Symbol glyph (star, diamond, pentagon, hexagon, triangle, circle, square) with an overshoot pop
- **Smooth shape scrolling** — velocity-continuous rAF scroll follow in both directions (glides back when deleting, no jumps)
- Battery, session selector, power buttons, keyboard layout toggle (full LightDM API integration)
- Works fully offline — bundled fonts, no CDN, no frameworks
- Built-in mock LightDM for browser development (password `1234`)

## Install

```bash
# 1. Copy the theme
cp -r theme/ii-lock-remastered ~/.config/nody-greeter/themes/
# or system-wide:
# sudo cp -r theme/ii-lock-remastered /usr/share/web-greeter/themes/

# 2. Activate it
sudo nano /etc/lightdm/web-greeter.yml
# set:  theme: ii-lock-remastered

# 3. Apply
sudo systemctl restart lightdm
```

## Develop

Open `index.html` in a browser — with no LightDM present it loads the mock API (password `1234`, battery/session simulation), so all animations can be previewed offline.

## Layout

Three floating cards, vertically centered:

| Left — clock | Middle — login | Right — system |
|---|---|---|
| Analog clock + digital time | Avatar, username, password pill | Battery, session, power, layout |

## License

MIT
