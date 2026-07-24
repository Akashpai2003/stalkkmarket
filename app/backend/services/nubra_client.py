import httpx
from typing import Dict, Any, List, Optional
import os
import json

SESSION_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "nubra_session.json")

class NubraClient:
    def __init__(self, use_uat: bool = True):
        self.base_url = "https://uatapi.nubra.io" if use_uat else "https://api.nubra.io"
        self.session_token: Optional[str] = None
        self.device_id: str = "STM_DEVICE_001"
        self.client = httpx.AsyncClient(timeout=15.0)
        self.mock_mode = True # Default to mock mode until session_token is authenticated
        self.saved_phone: Optional[str] = None
        self.saved_mpin: Optional[str] = None
        
        # Load persisted session
        self.load_session()

        
        # In-memory mock databases for testing without real API credentials
        self.mock_funds = {
            "start_of_day_funds": 500000.0,
            "net_margin_available": 482500.0,
            "total_margin_blocked": 17500.0,
            "brokerage": 150.0
        }
        self.mock_holdings = [
            {
                "ref_id": 83414,
                "nubra_name": "STOCK_TVSMOTOR.NSECM",
                "displayName": "TVSMOTOR",
                "derivative_type": "STOCK",
                "exchange": "NSE",
                "asset": "TVSMOTOR",
                "symbol": "TVSMOTOR",
                "qty": 5,
                "pledged_qty": 0,
                "avg_price": 2452.92,
                "prev_close": 2737.90,
                "ltp": 2750.50,
                "invested_value": 12264.6,
                "current_value": 13752.5,
                "net_pnl": 1487.9,
                "net_pnl_chg": 12.13,
                "day_pnl": 63.0,
                "haircut": 14.93
            },
            {
                "ref_id": 1842210,
                "nubra_name": "STOCK_RELIANCE.NSECM",
                "displayName": "RELIANCE",
                "derivative_type": "STOCK",
                "exchange": "NSE",
                "asset": "RELIANCE",
                "symbol": "RELIANCE",
                "qty": 10,
                "pledged_qty": 0,
                "avg_price": 2510.00,
                "prev_close": 2570.00,
                "ltp": 2580.40,
                "invested_value": 25100.0,
                "current_value": 25804.0,
                "net_pnl": 704.0,
                "net_pnl_chg": 2.80,
                "day_pnl": 104.0,
                "haircut": 12.50
            }
        ]
        self.mock_positions = [
            {
                "symbol": "HFCL",
                "displayName": "HFCL Ltd",
                "qty": 200,
                "avg_price": 110.0,
                "ltp": 115.4,
                "pnl": 1080.0,
                "status": "OPEN"
            },
            {
                "symbol": "KPITTECH",
                "displayName": "KPIT Technologies",
                "qty": 20,
                "avg_price": 1600.0,
                "ltp": 1640.2,
                "pnl": 804.0,
                "status": "OPEN"
            },
            {
                "symbol": "RELIANCE",
                "displayName": "Reliance Industries",
                "qty": 10,
                "avg_price": 2510.0,
                "ltp": 2540.5,
                "pnl": 305.0,
                "status": "CLOSED"
            }
        ]
        self.mock_orders = []
        # Generate mock historical orders for testing the heatmap in mock mode
        import random
        from datetime import datetime, timedelta
        
        symbols = ["TMCV", "HFCL", "KPITTECH", "RELIANCE", "BLS INTL", "JBM AUTO"]
        
        # Start from 360 days ago
        start_date = datetime.now() - timedelta(days=360)
        rng = random.Random(42)  # Fixed seed for consistency
        
        for i in range(50):
            sym = rng.choice(symbols)
            # Find a day for the trade
            days_offset = rng.randint(1, 350)
            trade_date = start_date + timedelta(days=days_offset)
            
            # Avoid weekends for trading
            if trade_date.weekday() >= 5:
                trade_date = trade_date - timedelta(days=trade_date.weekday() - 4)
                
            date_str = trade_date.strftime("%Y-%m-%d")
            
            buy_price = rng.uniform(100.0, 1500.0)
            qty = rng.randint(5, 50)
            buy_id = 2000 + i * 2
            
            # Add BUY order
            self.mock_orders.append({
                "order_id": buy_id,
                "ref_id": 100000 + buy_id,
                "order_qty": qty,
                "order_side": "ORDER_SIDE_BUY",
                "order_price": buy_price,
                "price_type": "MARKET",
                "order_status": "ORDER_STATUS_FILLED",
                "display_name": sym,
                "exchange": "NSE",
                "order_delivery_type": "ORDER_DELIVERY_TYPE_CNC",
                "timestamp": date_str
            })
            
            # Determine holding period: 1 to 10 days
            hold_days = rng.randint(1, 10)
            sell_date = trade_date + timedelta(days=hold_days)
            if sell_date.weekday() >= 5:
                sell_date = sell_date + timedelta(days=7 - sell_date.weekday())
                
            sell_date_str = sell_date.strftime("%Y-%m-%d")
            
            # 65% win rate
            is_win = rng.random() < 0.65
            pct_change = rng.uniform(0.015, 0.12) if is_win else -rng.uniform(0.01, 0.06)
            sell_price = buy_price * (1.0 + pct_change)
            sell_id = buy_id + 1
            
            # Add SELL order
            self.mock_orders.append({
                "order_id": sell_id,
                "ref_id": 100000 + sell_id,
                "order_qty": qty,
                "order_side": "ORDER_SIDE_SELL",
                "order_price": sell_price,
                "price_type": "MARKET",
                "order_status": "ORDER_STATUS_FILLED",
                "display_name": sym,
                "exchange": "NSE",
                "order_delivery_type": "ORDER_DELIVERY_TYPE_CNC",
                "timestamp": sell_date_str
            })

    def load_session(self):
        try:
            if os.path.exists(SESSION_FILE):
                with open(SESSION_FILE, "r") as f:
                    data = json.load(f)
                    self.session_token = data.get("session_token")
                    self.device_id = data.get("device_id", "STM_DEVICE_001")
                    self.mock_mode = data.get("mock_mode", True)
                    self.saved_phone = data.get("phone")
                    self.saved_mpin = data.get("mpin")
                    
                    # If we have a session token, we're not in mock mode unless specified
                    if self.session_token and not data.get("mock_mode", False):
                        self.mock_mode = False
        except Exception as e:
            print(f"Error loading Nubra session: {e}")

    def save_session(self):
        try:
            os.makedirs(os.path.dirname(SESSION_FILE), exist_ok=True)
            data = {
                "session_token": self.session_token,
                "device_id": self.device_id,
                "mock_mode": self.mock_mode,
                "phone": self.saved_phone,
                "mpin": self.saved_mpin
            }
            with open(SESSION_FILE, "w") as f:
                json.dump(data, f, indent=4)
        except Exception as e:
            print(f"Error saving Nubra session: {e}")

    async def check_session_validity(self) -> bool:
        if not self.session_token:
            return False
        
        orig_mock = self.mock_mode
        self.mock_mode = False
        try:
            res = await self.get_funds()
            if "error" in res or res.get("message") == "Not authenticated":
                # Session is invalid or not authenticated
                self.mock_mode = orig_mock
                self.session_token = None
                self.save_session()
                return False
            
            # Stays valid
            self.mock_mode = False
            self.save_session()
            return True
        except Exception:
            self.mock_mode = orig_mock
            return False

    async def validate_endpoints(self) -> Dict[str, Any]:
        """
        Validate all key endpoints: funds, holdings, positions.
        """
        import asyncio
        if not self.session_token:
            return {"success": False, "reason": "No session token"}
        
        if self.mock_mode:
            return {
                "success": True, 
                "endpoints": {
                    "funds": "OK",
                    "holdings": "OK",
                    "positions": "OK"
                }
            }
            
        try:
            # Check in parallel using asyncio.gather
            funds_task = self.get_funds()
            holdings_task = self.get_holdings()
            positions_task = self.get_positions()
            
            funds_res, holdings_res, positions_res = await asyncio.gather(
                funds_task, holdings_task, positions_task
            )
            
            results = {}
            errors = []
            
            # Check funds
            if isinstance(funds_res, dict) and "error" in funds_res:
                results["funds"] = "FAILED"
                errors.append(f"Funds: {funds_res['error']}")
            else:
                results["funds"] = "OK"
                
            # Check holdings
            if isinstance(holdings_res, dict) and "error" in holdings_res:
                results["holdings"] = "FAILED"
                errors.append(f"Holdings: {holdings_res['error']}")
            else:
                results["holdings"] = "OK"
                
            # Check positions
            if isinstance(positions_res, dict) and "error" in positions_res:
                results["positions"] = "FAILED"
                errors.append(f"Positions: {positions_res['error']}")
            else:
                results["positions"] = "OK"
                
            success = len(errors) == 0
            return {
                "success": success,
                "endpoints": results,
                "errors": errors
            }
        except Exception as e:
            return {
                "success": False,
                "reason": str(e),
                "endpoints": {
                    "funds": "UNKNOWN",
                    "holdings": "UNKNOWN",
                    "positions": "UNKNOWN"
                }
            }

    def set_session_token(self, token: str, device_id: str = "STM_DEVICE_001"):
        self.session_token = token
        self.device_id = device_id
        self.mock_mode = False # Disable mock mode once a real token is explicitly set
        self.save_session()

    def set_mock_mode(self, enabled: bool):
        self.mock_mode = enabled
        self.save_session()

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "x-device-id": self.device_id
        }
        if self.session_token:
            headers["Authorization"] = f"Bearer {self.session_token}"
        return headers

    def _api_error(self, response, fallback: str) -> Dict[str, Any]:
        try:
            body = response.json()
        except Exception:
            body = {"raw": response.text[:500]}
        return {
            "error": f"HTTP {response.status_code}",
            "message": body.get("message") or body.get("error") or fallback,
            "raw": body,
            "success": False,
        }

    # --- AUTHENTICATION ---
    async def send_phone_otp(self, phone: str, skip_totp: bool = False, temp_token: str = None) -> Dict[str, Any]:
        """
        Step 1 & 2: Initiate login / send OTP.
        """
        if self.mock_mode and phone == "0000000000":
            return {
                "attempts_left": 4,
                "message": "MOCK MODE: OTP Sent to 0000000000",
                "next": "VERIFY_MOBILE",
                "phone": phone,
                "temp_token": "mock_temp_token_xyz"
            }
            
        url = f"{self.base_url}/sendphoneotp"
        headers = {"Content-Type": "application/json"}
        if temp_token:
            headers["x-temp-token"] = temp_token
            
        payload = {
            "phone": phone,
            "skip_totp": skip_totp
        }
        
        try:
            response = await self.client.post(url, headers=headers, json=payload)
            return response.json()
        except Exception as e:
            return {"error": str(e), "message": "Failed to send OTP", "success": False}

    async def verify_phone_otp(self, phone: str, otp: str, temp_token: str) -> Dict[str, Any]:
        """
        Step 3: Verify OTP.
        """
        if self.mock_mode and temp_token == "mock_temp_token_xyz":
            if otp == "123456":
                self.saved_phone = phone
                self.save_session()
                return {
                    "auth_token": "mock_auth_token_abc",
                    "next": "ENTER_MPIN",
                    "message": "MOCK MODE: OTP verified successfully"
                }
            else:
                return {"error": "Invalid OTP in Mock Mode", "message": "Verification failed"}

        url = f"{self.base_url}/verifyphoneotp"
        headers = {
            "Content-Type": "application/json",
            "x-temp-token": temp_token,
            "x-device-id": self.device_id
        }
        payload = {
            "phone": phone,
            "otp": otp
        }
        
        try:
            response = await self.client.post(url, headers=headers, json=payload)
            res_json = response.json()
            if response.status_code < 400 and "auth_token" in res_json:
                self.saved_phone = phone
                self.save_session()
            return res_json
        except Exception as e:
            return {"error": str(e), "message": "Failed to verify OTP", "success": False}

    async def verify_mpin(self, pin: str, auth_token: str) -> Dict[str, Any]:
        """
        Step 4: Verify MPIN.
        """
        if self.mock_mode and auth_token == "mock_auth_token_abc":
            if pin == "1234":
                self.set_session_token("mock_session_token_12345")
                self.mock_mode = True # Note: Keep mock_mode True for other actions unless user disables it
                self.saved_mpin = pin
                self.save_session()
                return {
                    "email": "demo@stalkthemarket.com",
                    "message": "Login Successful (Mock)",
                    "next": "DASHBOARD",
                    "phone": "0000000000",
                    "session_token": "mock_session_token_12345",
                    "userId": 999
                }
            else:
                return {"error": "Invalid PIN in Mock Mode", "message": "Verification failed"}

        url = f"{self.base_url}/verifypin"
        headers = {
            "Content-Type": "application/json",
            "x-device-id": self.device_id,
            "Authorization": f"Bearer {auth_token}"
        }
        payload = {"pin": pin}
        
        try:
            response = await self.client.post(url, headers=headers, json=payload)
            res_json = response.json()
            if "session_token" in res_json:
                self.session_token = res_json["session_token"]
                self.mock_mode = False
                self.saved_mpin = pin
                self.save_session()
            return res_json
        except Exception as e:
            return {"error": str(e), "message": "Failed to verify MPIN", "success": False}

    # --- PORTFOLIO & FUNDS ---
    async def get_funds(self) -> Dict[str, Any]:
        if not self.session_token:
            return {
                "message": "Not authenticated",
                "port_funds_and_margin": {
                    "start_of_day_funds": 0.0,
                    "net_margin_available": 0.0,
                    "total_margin_blocked": 0.0,
                    "brokerage": 0.0
                }
            }
        if self.mock_mode:
            return {
                "message": "portfolio and funds values fetched successfully (Mock)",
                "port_funds_and_margin": self.mock_funds
            }
        
        url = f"{self.base_url}/portfolio/user_funds_and_margin"
        try:
            response = await self.client.get(url, headers=self._get_headers())
            if response.status_code >= 400:
                return self._api_error(response, "Failed to fetch funds")
            data = response.json()
            if "port_funds_and_margin" not in data:
                return {"error": "INVALID_FUNDS_PAYLOAD", "message": "Nubra response did not contain funds and margin data.", "raw": data, "success": False}
            return data
        except Exception as e:
            return {"error": str(e), "message": "Failed to fetch funds", "success": False}

    async def get_holdings(self) -> Dict[str, Any]:
        if not self.session_token:
            return {
                "message": "Not authenticated",
                "portfolio": {
                    "client_code": "UNAUTHENTICATED",
                    "holding_stats": {
                        "invested_amount": 0.0,
                        "current_value": 0.0,
                        "total_pnl": 0.0,
                        "total_pnl_chg": 0.0,
                        "day_pnl": 0.0,
                        "day_pnl_chg": 0.0
                    },
                    "holdings": []
                }
            }
        if self.mock_mode:
            return {
                "message": "holdings (Mock)",
                "portfolio": {
                    "client_code": "STM_MOCK",
                    "holding_stats": {
                        "invested_amount": sum(h["invested_value"] for h in self.mock_holdings),
                        "current_value": sum(h["current_value"] for h in self.mock_holdings),
                        "total_pnl": sum(h["net_pnl"] for h in self.mock_holdings),
                        "total_pnl_chg": 5.4,
                        "day_pnl": sum(h["day_pnl"] for h in self.mock_holdings),
                        "day_pnl_chg": 0.4
                    },
                    "holdings": self.mock_holdings
                }
            }
            
        url = f"{self.base_url}/portfolio/holdings"
        try:
            response = await self.client.get(url, headers=self._get_headers())
            if response.status_code >= 400:
                return self._api_error(response, "Failed to fetch holdings")
            data = response.json()
            if "portfolio" not in data:
                return {"error": "INVALID_HOLDINGS_PAYLOAD", "message": "Nubra response did not contain portfolio holdings.", "raw": data, "success": False}
            return data
        except Exception as e:
            return {"error": str(e), "message": "Failed to fetch holdings", "success": False}

    async def get_positions(self) -> Dict[str, Any]:
        if not self.session_token:
            return {
                "message": "Not authenticated",
                "portfolio": {
                    "client_code": "UNAUTHENTICATED",
                    "position_stats": {
                        "realised_pnl": 0.0,
                        "unrealised_pnl": 0.0,
                        "total_pnl": 0.0,
                        "total_pnl_chg": 0.0
                    },
                    "stock_positions": [],
                    "close_positions": []
                }
            }
        if self.mock_mode:
            return {
                "message": "positions (Mock)",
                "portfolio": {
                    "client_code": "STM_MOCK",
                    "position_stats": {
                        "realised_pnl": sum(p["pnl"] for p in self.mock_positions if p.get("status") == "CLOSED"),
                        "unrealised_pnl": sum(p["pnl"] for p in self.mock_positions if p.get("status") != "CLOSED"),
                        "total_pnl": sum(p["pnl"] for p in self.mock_positions),
                        "total_pnl_chg": 0.0
                    },
                    "stock_positions": [p for p in self.mock_positions if p.get("status") != "CLOSED"],
                    "close_positions": [p for p in self.mock_positions if p.get("status") == "CLOSED"]
                }
            }
            
        url = f"{self.base_url}/portfolio/positions"
        try:
            response = await self.client.get(url, headers=self._get_headers())
            if response.status_code >= 400:
                return self._api_error(response, "Failed to fetch positions")
            data = response.json()
            if "portfolio" not in data:
                return {"error": "INVALID_POSITIONS_PAYLOAD", "message": "Nubra response did not contain portfolio positions.", "raw": data, "success": False}
            return data
        except Exception as e:
            return {"error": str(e), "message": "Failed to fetch positions", "success": False}

    # --- ORDER EXECUTION ---
    async def get_margin_required(self, ref_id: int, qty: int, side: str, price: float = 0.0) -> Dict[str, Any]:
        """
        Estimate margin required before trade execution.
        """
        if self.mock_mode:
            total_margin = (price or 150.0) * qty * 0.2 # 20% margin for CNC
            return {
                "span": 0.0,
                "exposure": 0.0,
                "total_margin": total_margin,
                "margin_benefit": 0.0,
                "message": "Mock calculation"
            }
            
        url = f"{self.base_url}/orders/v2/margin_required"
        payload = {
            "with_portfolio": True,
            "with_legs": False,
            "is_basket": False,
            "order_req": {
                "exchange": "NSE",
                "orders": [
                    {
                        "ref_id": ref_id,
                        "order_type": "ORDER_TYPE_REGULAR",
                        "price_type": "MARKET" if price == 0 else "LIMIT",
                        "order_qty": qty,
                        "order_price": int(price * 100), # in paise
                        "order_side": f"ORDER_SIDE_{side.upper()}",
                        "order_delivery_type": "ORDER_DELIVERY_TYPE_CNC",
                        "validity_type": "DAY",
                        "request_type": "ORDER_REQUEST_NEW"
                    }
                ]
            }
        }
        
        try:
            response = await self.client.post(url, headers=self._get_headers(), json=payload)
            return response.json()
        except Exception as e:
            return {"error": str(e), "message": "Failed to compute margin required"}

    async def place_order(
        self,
        ref_id: int,
        qty: int,
        side: str,
        price: float = 0.0,
        price_type: str = "MARKET",
        symbol: str = "UNKNOWN"
    ) -> Dict[str, Any]:
        """
        Place a new order.
        """
        if self.mock_mode:
            order_id = len(self.mock_orders) + 1001
            new_order = {
                "order_id": order_id,
                "ref_id": ref_id,
                "order_qty": qty,
                "order_side": f"ORDER_SIDE_{side.upper()}",
                "order_price": price,
                "price_type": price_type,
                "order_status": "ORDER_STATUS_FILLED",
                "display_name": symbol,
                "exchange": "NSE",
                "order_delivery_type": "ORDER_DELIVERY_TYPE_CNC"
            }
            self.mock_orders.append(new_order)
            
            # Update holdings/positions mock db
            match_holding = next((h for h in self.mock_holdings if h["ref_id"] == ref_id), None)
            if side.upper() == "BUY":
                if match_holding:
                    # average out
                    old_cost = match_holding["invested_value"]
                    new_cost = price * qty
                    match_holding["qty"] += qty
                    match_holding["invested_value"] += new_cost
                    match_holding["avg_price"] = match_holding["invested_value"] / match_holding["qty"]
                    match_holding["current_value"] = match_holding["ltp"] * match_holding["qty"]
                    match_holding["net_pnl"] = match_holding["current_value"] - match_holding["invested_value"]
                else:
                    self.mock_holdings.append({
                        "ref_id": ref_id,
                        "nubra_name": f"STOCK_{symbol}.NSECM",
                        "displayName": symbol,
                        "derivative_type": "STOCK",
                        "exchange": "NSE",
                        "asset": symbol,
                        "symbol": symbol,
                        "qty": qty,
                        "pledged_qty": 0,
                        "avg_price": price,
                        "prev_close": price,
                        "ltp": price,
                        "invested_value": price * qty,
                        "current_value": price * qty,
                        "net_pnl": 0.0,
                        "net_pnl_chg": 0.0,
                        "day_pnl": 0.0,
                        "haircut": 15.0
                    })
                # Deduct funds
                self.mock_funds["net_margin_available"] -= (price * qty)
            else:
                # Sell
                if match_holding:
                    if match_holding["qty"] >= qty:
                        match_holding["qty"] -= qty
                        match_holding["invested_value"] = match_holding["qty"] * match_holding["avg_price"]
                        match_holding["current_value"] = match_holding["qty"] * match_holding["ltp"]
                        match_holding["net_pnl"] = match_holding["current_value"] - match_holding["invested_value"]
                        if match_holding["qty"] == 0:
                            self.mock_holdings.remove(match_holding)
                    else:
                        return {"success": False, "message": "Insufficient holdings quantity"}
                # Add funds
                self.mock_funds["net_margin_available"] += (price * qty)

            return {
                "message": "Order placed successfully (Mock)",
                "success": True,
                "order": new_order
            }
            
        url = f"{self.base_url}/orders/v2/single"
        payload = {
            "ref_id": ref_id,
            "order_type": "ORDER_TYPE_REGULAR",
            "order_qty": qty,
            "order_side": f"ORDER_SIDE_{side.upper()}",
            "order_delivery_type": "ORDER_DELIVERY_TYPE_CNC",
            "validity_type": "DAY",
            "price_type": price_type.upper(),
            "order_price": int(price * 100), # in paise
            "tag": "stm_auto_trade",
            "algo_params": {}
        }
        
        try:
            response = await self.client.post(url, headers=self._get_headers(), json=payload)
            res_json = response.json()
            return {
                "message": "Order placement pushed",
                "success": response.status_code < 400,
                "order": res_json
            }
        except Exception as e:
            return {"error": str(e), "message": "Failed to place order", "success": False}

    async def get_orders(self) -> List[Dict[str, Any]]:
        if self.mock_mode:
            return self.mock_orders
            
        url = f"{self.base_url}/orders/v2"
        try:
            response = await self.client.get(url, headers=self._get_headers())
            return response.json()
        except Exception as e:
            return []
            
    async def close(self):
        await self.client.aclose()
