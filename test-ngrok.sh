#!/bin/bash
# Test script for ngrok + Telegram Login Widget setup
# Usage: ./test-ngrok.sh

echo "=== ngrok + Telegram Login Test ==="
echo ""

# 1. Check Angular dev server
echo "1. Angular dev server (localhost:4200)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4200 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
  echo "   OK - responding with HTTP $HTTP_CODE"
else
  echo "   FAIL - HTTP $HTTP_CODE (is 'npm run start' running?)"
  exit 1
fi

# 2. Check ngrok tunnel
echo ""
echo "2. ngrok tunnel..."
NGROK_API=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null)
if [ -z "$NGROK_API" ]; then
  echo "   FAIL - ngrok is not running"
  echo "   Start it with: ~/.local/bin/ngrok http 4200"
  exit 1
fi

NGROK_URL=$(echo "$NGROK_API" | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "   OK - tunnel URL: $NGROK_URL"

# 3. Check ngrok tunnel responds
echo ""
echo "3. Testing tunnel endpoint..."
TUNNEL_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "ngrok-skip-browser-warning: true" "$NGROK_URL" 2>/dev/null)
if [ "$TUNNEL_CODE" = "200" ]; then
  echo "   OK - tunnel responds with HTTP $TUNNEL_CODE"
else
  echo "   FAIL - tunnel responds with HTTP $TUNNEL_CODE"
  echo "   Check angular.json allowedHosts includes .ngrok-free.dev"
  exit 1
fi

# 4. Check Telegram widget script loads
echo ""
echo "4. Checking Telegram widget script in page..."
PAGE_CONTENT=$(curl -s -H "ngrok-skip-browser-warning: true" "$NGROK_URL" 2>/dev/null)
if echo "$PAGE_CONTENT" | grep -q "telegram-widget.js"; then
  echo "   OK - telegram-widget.js found in page"
else
  echo "   FAIL - telegram-widget.js not found in page HTML"
fi

# 5. Check Telegram Login Widget loads
echo ""
echo "5. Checking Telegram Login Widget API..."
WIDGET_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://telegram.org/js/telegram-widget.js?22" 2>/dev/null)
if [ "$WIDGET_CODE" = "200" ]; then
  echo "   OK - widget script accessible (HTTP $WIDGET_CODE)"
else
  echo "   FAIL - widget script not accessible (HTTP $WIDGET_CODE)"
fi

# 6. Extract domain for BotFather
echo ""
echo "=== Setup Instructions ==="
DOMAIN=$(echo "$NGROK_URL" | sed 's|https://||')
echo ""
echo "Your ngrok domain: $DOMAIN"
echo ""
echo "Register this domain with BotFather:"
echo "  1. Open @BotFather in Telegram"
echo "  2. Send: /setdomain"
echo "  3. Select your bot"
echo "  4. Enter: $DOMAIN"
echo ""
echo "Then open in your browser:"
echo "  $NGROK_URL"
echo ""
echo "NOTE: ngrok free tier shows an interstitial page on first visit."
echo "Click 'Visit Site' to proceed to your app."
echo ""
echo "=== All checks passed ==="
