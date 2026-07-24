import os
import json
import urllib.request
import csv
import io

# We will try a few sources to download the Nifty 100 list
urls = [
    "https://archives.nseindia.com/content/indices/ind_nifty100list.csv",
    "https://raw.githubusercontent.com/anirban-m/nse-indices/master/ind_nifty100list.csv",
    "https://raw.githubusercontent.com/kaushik17/nse-indices/master/ind_nifty100list.csv"
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
}

data_str = None
for url in urls:
    try:
        print(f"Trying to fetch Nifty 100 from: {url}")
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as response:
            data_str = response.read().decode('utf-8')
            print("Successfully fetched!")
            break
    except Exception as e:
        print(f"Failed to fetch from {url}: {e}")

stocks = []

# Map of common NSE symbols to their sector in case sector column is empty or generic
fallback_sectors = {
    "RELIANCE": "Energy", "TCS": "Information Technology", "HDFCBANK": "Financial Services",
    "ICICIBANK": "Financial Services", "BHARTIARTL": "Telecommunication", "INFY": "Information Technology",
    "ITC": "Fast Moving Consumer Goods", "LICI": "Financial Services", "LT": "Construction",
    "HCLTECH": "Information Technology", "SBIN": "Financial Services", "AXISBANK": "Financial Services",
    "KOTAKBANK": "Financial Services", "SUNPHARMA": "Healthcare", "HINDUNILVR": "Fast Moving Consumer Goods",
    "TATAMOTORS": "Automobile and Auto Components", "NTPC": "Power", "ONGC": "Energy",
    "POWERGRID": "Power", "ADANIENT": "Metals & Mining", "COALINDIA": "Energy",
    "JSWSTEEL": "Metals & Mining", "M&M": "Automobile and Auto Components", "TATASTEEL": "Metals & Mining",
    "MARUTI": "Automobile and Auto Components", "LTIM": "Information Technology", "ULTRACEMCO": "Construction Materials",
    "SIEMENS": "Capital Goods", "GRASIM": "Construction Materials", "ADANIPORTS": "Services",
    "HINDALCO": "Metals & Mining", "NESTLEIND": "Fast Moving Consumer Goods", "BAJAJ-AUTO": "Automobile and Auto Components",
    "TITAN": "Consumer Durables", "WIPRO": "Information Technology", "HAL": "Capital Goods",
    "BAJFINANCE": "Financial Services", "ASIANPAINT": "Consumer Durables", "ADANIPOWER": "Power",
    "Avenue Supermarts": "Consumer Services", "DMART": "Consumer Services", "BPCL": "Energy",
    "JIOFIN": "Financial Services", "CHOLAFIN": "Financial Services", "TRENT": "Consumer Services",
    "DLF": "Realty", "EICHERMOT": "Automobile and Auto Components", "INDIGO": "Services",
    "BEL": "Capital Goods", "DIVISLAB": "Healthcare", "DRREDDY": "Healthcare",
    "BAJAJFINSV": "Financial Services", "PNB": "Financial Services", "SHRIRAMFIN": "Financial Services",
    "HAVELLS": "Consumer Durables", "TATAPOWER": "Power", "HDFCLIFE": "Financial Services",
    "RECLTD": "Financial Services", "PFC": "Financial Services", "IOC": "Energy",
    "VBL": "Fast Moving Consumer Goods", "GAIL": "Energy", "PIDILITIND": "Chemicals",
    "ZOMATO": "Consumer Services", "MUTHOOTFIN": "Financial Services", "COLPAL": "Fast Moving Consumer Goods",
    "CIPLA": "Healthcare", "HEROMOTOCO": "Automobile and Auto Components", "LUPIN": "Healthcare",
    "APOLLOHOSP": "Healthcare", "TVSMOTOR": "Automobile and Auto Components", "ICICIGI": "Financial Services",
    "POLYCAB": "Capital Goods", "AMBUJACEM": "Construction Materials", "SBILIFE": "Financial Services",
    "BOSCHLTD": "Automobile and Auto Components", "MAXHEALTH": "Healthcare", "SRF": "Chemicals",
    "INDUSINDBK": "Financial Services", "BRITANNIA": "Fast Moving Consumer Goods", "PIIND": "Chemicals",
    "SHREECEM": "Construction Materials", "MARICO": "Fast Moving Consumer Goods", "ABB": "Capital Goods",
    "GODREJCP": "Fast Moving Consumer Goods", "GMRINFRA": "Services", "UPL": "Chemicals",
    "TATACOMM": "Telecommunication", "BERGEPAINT": "Consumer Durables", "DLF": "Realty",
    "ICICIPRULI": "Financial Services", "AUROPHARMA": "Healthcare", "ASHOKLEY": "Automobile and Auto Components",
    "ASTRAL": "Capital Goods", "BALKRISIND": "Automobile and Auto Components", "BANDHANBNK": "Financial Services",
    "BANKBARODA": "Financial Services", "BHEL": "Capital Goods", "BIOCON": "Healthcare",
    "CGPOWER": "Capital Goods", "CANBK": "Financial Services", "COFORGE": "Information Technology",
    "CONCOR": "Services", "COROMANDEL": "Chemicals", "DABUR": "Fast Moving Consumer Goods",
    "GODREJPROP": "Realty", "IEX": "Services", "IPCALAB": "Healthcare",
    "JSWENERGY": "Power", "LICHSGFIN": "Financial Services", "M&MFIN": "Financial Services",
    "NMDC": "Metals & Mining", "OFSS": "Information Technology", "PAGEIND": "Textiles",
    "PEL": "Financial Services", "SONACOMS": "Automobile and Auto Components", "SUNTV": "Media",
    "TATACONSUM": "Fast Moving Consumer Goods", "TECHM": "Information Technology", "TORNTPHARM": "Healthcare",
    "UNOMINDA": "Automobile and Auto Components", "VEDL": "Metals & Mining", "ZYDUSLIFE": "Healthcare"
}

if data_str:
    try:
        reader = csv.reader(io.StringIO(data_str))
        header = next(reader) # Skip header row
        print(f"CSV Headers: {header}")
        
        # Determine column indices
        # Standard columns: Company Name, Industry, Symbol, Series, ISIN Code
        name_idx, symbol_idx, sector_idx = -1, -1, -1
        for idx, h in enumerate(header):
            h_lower = h.lower()
            if "company name" in h_lower:
                name_idx = idx
            elif "symbol" in h_lower:
                symbol_idx = idx
            elif "industry" in h_lower or "sector" in h_lower:
                sector_idx = idx
        
        if symbol_idx != -1:
            for row in reader:
                if not row or len(row) <= max(symbol_idx, name_idx):
                    continue
                symbol = row[symbol_idx].strip()
                company_name = row[name_idx].strip() if name_idx != -1 else symbol
                sector = row[sector_idx].strip() if (sector_idx != -1 and sector_idx < len(row)) else "Other"
                
                if sector in ["", "Other", "-"]:
                    sector = fallback_sectors.get(symbol, "Other")
                
                stocks.append({
                    "Symbol": symbol,
                    "Company Name": company_name,
                    "Sector": sector
                })
    except Exception as parse_err:
        print(f"Error parsing CSV data: {parse_err}")

# If we couldn't fetch or parse, load a robust fallback of Nifty 100 constituents
if not stocks:
    print("Using hardcoded fallback list of Nifty 100 constituents...")
    fallback_list = [
        ("ABB", "ABB India Ltd.", "Capital Goods"),
        ("ACC", "ACC Ltd.", "Construction Materials"),
        ("ADANIENT", "Adani Enterprises Ltd.", "Metals & Mining"),
        ("ADANIPORTS", "Adani Ports and Special Economic Zone Ltd.", "Services"),
        ("ADANIPOWER", "Adani Power Ltd.", "Power"),
        ("ADANIGREEN", "Adani Green Energy Ltd.", "Power"),
        ("ADANIENSOL", "Adani Energy Solutions Ltd.", "Power"),
        ("AMBUJACEM", "Ambuja Cements Ltd.", "Construction Materials"),
        ("APOLLOHOSP", "Apollo Hospitals Enterprise Ltd.", "Healthcare"),
        ("ASHOKLEY", "Ashok Leyland Ltd.", "Automobile and Auto Components"),
        ("ASIANPAINT", "Asian Paints Ltd.", "Consumer Durables"),
        ("ASTRAL", "Astral Ltd.", "Capital Goods"),
        ("AUROPHARMA", "Aurobindo Pharma Ltd.", "Healthcare"),
        ("DMART", "Avenue Supermarts Ltd.", "Consumer Services"),
        ("AXISBANK", "Axis Bank Ltd.", "Financial Services"),
        ("BAJAJ-AUTO", "Bajaj Auto Ltd.", "Automobile and Auto Components"),
        ("BAJFINANCE", "Bajaj Finance Ltd.", "Financial Services"),
        ("BAJAJFINSV", "Bajaj Finserv Ltd.", "Financial Services"),
        ("BAJAJHLDNG", "Bajaj Holdings & Investment Ltd.", "Financial Services"),
        ("BALKRISIND", "Balkrishna Industries Ltd.", "Automobile and Auto Components"),
        ("BANDHANBNK", "Bandhan Bank Ltd.", "Financial Services"),
        ("BANKBARODA", "Bank of Baroda", "Financial Services"),
        ("BEL", "Bharat Electronics Ltd.", "Capital Goods"),
        ("BHEL", "Bharat Heavy Electricals Ltd.", "Capital Goods"),
        ("BPCL", "Bharat Petroleum Corporation Ltd.", "Energy"),
        ("BHARTIARTL", "Bharti Airtel Ltd.", "Telecommunication"),
        ("BIOCON", "Biocon Ltd.", "Healthcare"),
        ("BOSCHLTD", "Bosch Ltd.", "Automobile and Auto Components"),
        ("BRITANNIA", "Britannia Industries Ltd.", "Fast Moving Consumer Goods"),
        ("CGPOWER", "CG Power and Industrial Solutions Ltd.", "Capital Goods"),
        ("CANBK", "Canara Bank", "Financial Services"),
        ("CHOLAFIN", "Cholamandalam Investment and Finance Company Ltd.", "Financial Services"),
        ("CIPLA", "Cipla Ltd.", "Healthcare"),
        ("COALINDIA", "Coal India Ltd.", "Energy"),
        ("COFORGE", "Coforge Ltd.", "Information Technology"),
        ("COLPAL", "Colgate-Palmolive (India) Ltd.", "Fast Moving Consumer Goods"),
        ("CONCOR", "Container Corporation of India Ltd.", "Services"),
        ("COROMANDEL", "Coromandel International Ltd.", "Chemicals"),
        ("DLF", "DLF Ltd.", "Realty"),
        ("DABUR", "Dabur India Ltd.", "Fast Moving Consumer Goods"),
        ("DIVISLAB", "Divi's Laboratories Ltd.", "Healthcare"),
        ("DRREDDY", "Dr. Reddy's Laboratories Ltd.", "Healthcare"),
        ("EICHERMOT", "Eicher Motors Ltd.", "Automobile and Auto Components"),
        ("YESBANK", "Yes Bank Ltd.", "Financial Services"),
        ("GAIL", "GAIL (India) Ltd.", "Energy"),
        ("GMRINFRA", "GMR Airports Infrastructure Ltd.", "Services"),
        ("HAL", "Hindustan Aeronautics Ltd.", "Capital Goods"),
        ("GODREJCP", "Godrej Consumer Products Ltd.", "Fast Moving Consumer Goods"),
        ("GODREJPROP", "Godrej Properties Ltd.", "Realty"),
        ("GRASIM", "Grasim Industries Ltd.", "Construction Materials"),
        ("HCLTECH", "HCL Technologies Ltd.", "Information Technology"),
        ("HDFCBANK", "HDFC Bank Ltd.", "Financial Services"),
        ("HDFCLIFE", "HDFC Life Insurance Company Ltd.", "Financial Services"),
        ("HAVELLS", "Havells India Ltd.", "Consumer Durables"),
        ("HEROMOTOCO", "Hero MotoCorp Ltd.", "Automobile and Auto Components"),
        ("HINDALCO", "Hindalco Industries Ltd.", "Metals & Mining"),
        ("HINDUNILVR", "Hindustan Unilever Ltd.", "Fast Moving Consumer Goods"),
        ("ICICIBANK", "ICICI Bank Ltd.", "Financial Services"),
        ("ICICIGI", "ICICI Lombard General Insurance Company Ltd.", "Financial Services"),
        ("ICICIPRULI", "ICICI Prudential Life Insurance Company Ltd.", "Financial Services"),
        ("IEX", "Indian Energy Exchange Ltd.", "Services"),
        ("ITC", "ITC Ltd.", "Fast Moving Consumer Goods"),
        ("IOC", "Indian Oil Corporation Ltd.", "Energy"),
        ("INDUSINDBK", "IndusInd Bank Ltd.", "Financial Services"),
        ("INFY", "Infosys Ltd.", "Information Technology"),
        ("INDIGO", "InterGlobe Aviation Ltd.", "Services"),
        ("IPCALAB", "IPCA Laboratories Ltd.", "Healthcare"),
        ("JSWSTEEL", "JSW Steel Ltd.", "Metals & Mining"),
        ("JSWENERGY", "JSW Energy Ltd.", "Power"),
        ("JIOFIN", "Jio Financial Services Ltd.", "Financial Services"),
        ("KOTAKBANK", "Kotak Mahindra Bank Ltd.", "Financial Services"),
        ("LT", "Larsen & Toubro Ltd.", "Construction"),
        ("LTIM", "LTIMindtree Ltd.", "Information Technology"),
        ("LTTS", "L&T Technology Services Ltd.", "Information Technology"),
        ("LICHSGFIN", "LIC Housing Finance Ltd.", "Financial Services"),
        ("LUPIN", "Lupin Ltd.", "Healthcare"),
        ("M&M", "Mahindra & Mahindra Ltd.", "Automobile and Auto Components"),
        ("M&MFIN", "Mahindra & Mahindra Financial Services Ltd.", "Financial Services"),
        ("MARICO", "Marico Ltd.", "Fast Moving Consumer Goods"),
        ("MARUTI", "Maruti Suzuki India Ltd.", "Automobile and Auto Components"),
        ("MUTHOOTFIN", "Muthoot Finance Ltd.", "Financial Services"),
        ("NYKAA", "FSN E-Commerce Ventures Ltd. (Nykaa)", "Consumer Services"),
        ("NTPC", "NTPC Ltd.", "Power"),
        ("NESTLEIND", "Nestle India Ltd.", "Fast Moving Consumer Goods"),
        ("NMDC", "NMDC Ltd.", "Metals & Mining"),
        ("ONGC", "Oil & Natural Gas Corporation Ltd.", "Energy"),
        ("OFSS", "Oracle Financial Services Software Ltd.", "Information Technology"),
        ("PAGEIND", "Page Industries Ltd.", "Textiles"),
        ("PIIND", "PI Industries Ltd.", "Chemicals"),
        ("PIDILITIND", "Pidilite Industries Ltd.", "Chemicals"),
        ("PFC", "Power Finance Corporation Ltd.", "Financial Services"),
        ("POWERGRID", "Power Grid Corporation of India Ltd.", "Power"),
        ("PNB", "Punjab National Bank", "Financial Services"),
        ("RECLTD", "REC Ltd.", "Financial Services"),
        ("RELIANCE", "Reliance Industries Ltd.", "Energy"),
        ("SBICARD", "SBI Cards and Payment Services Ltd.", "Financial Services"),
        ("SBILIFE", "SBI Life Insurance Company Ltd.", "Financial Services"),
        ("SRF", "SRF Ltd.", "Chemicals"),
        ("MOTHERSON", "Samvardhana Motherson International Ltd.", "Automobile and Auto Components"),
        ("SBIN", "State Bank of India", "Financial Services"),
        ("SHREECEM", "Shree Cement Ltd.", "Construction Materials"),
        ("SHRIRAMFIN", "Shriram Finance Ltd.", "Financial Services"),
        ("SIEMENS", "Siemens Ltd.", "Capital Goods"),
        ("SONACOMS", "Sona BLW Precision Forgings Ltd.", "Automobile and Auto Components"),
        ("SUNPHARMA", "Sun Pharmaceutical Industries Ltd.", "Healthcare"),
        ("SUNTV", "Sun TV Network Ltd.", "Media"),
        ("TATACOMM", "Tata Communications Ltd.", "Telecommunication"),
        ("TCS", "Tata Consultancy Services Ltd.", "Information Technology"),
        ("TATACONSUM", "Tata Consumer Products Ltd.", "Fast Moving Consumer Goods"),
        ("TATAMOTORS", "Tata Motors Ltd.", "Automobile and Auto Components"),
        ("TATAPOWER", "Tata Power Company Ltd.", "Power"),
        ("TATASTEEL", "Tata Steel Ltd.", "Metals & Mining"),
        ("TRENT", "Trent Ltd.", "Consumer Services"),
        ("TVSMOTOR", "TVS Motor Company Ltd.", "Automobile and Auto Components"),
        ("TECHM", "Tech Mahindra Ltd.", "Information Technology"),
        ("TITAN", "Titan Company Ltd.", "Consumer Durables"),
        ("TORNTPHARM", "Torrent Pharmaceuticals Ltd.", "Healthcare"),
        ("UNOMINDA", "Uno Minda Ltd.", "Automobile and Auto Components"),
        ("UPL", "UPL Ltd.", "Chemicals"),
        ("ULTRACEMCO", "UltraTech Cement Ltd.", "Construction Materials"),
        ("VBL", "Varun Beverages Ltd.", "Fast Moving Consumer Goods"),
        ("VEDL", "Vedanta Ltd.", "Metals & Mining"),
        ("WIPRO", "Wipro Ltd.", "Information Technology"),
        ("ZOMATO", "Zomato Ltd.", "Consumer Services"),
        ("ZYDUSLIFE", "Zydus Lifesciences Ltd.", "Healthcare"),
        ("RVNL", "Rail Vikas Nigam Ltd.", "Capital Goods"),
        ("RAMCOCEM", "The Ramco Cements Ltd.", "Construction Materials"),
        ("RBLBANK", "RBL Bank Ltd.", "Financial Services"),
    ]
    for sym, name, sec in fallback_list:
        stocks.append({
            "Symbol": sym,
            "Company Name": name,
            "Sector": sec
        })

print(f"Total stocks indexed: {len(stocks)}")

# Save to backend
backend_path = os.path.join("app", "backend", "stock_index.json")
# Wait, this script is run from C:\Users\akash\Stock trading AI Analysis
# So let's make the path relative to C:\Users\akash\Stock trading AI Analysis
# Let's check where it is run
with open(backend_path, "w") as f:
    json.dump(stocks, f, indent=2)
print(f"Saved to backend: {os.path.abspath(backend_path)}")

# Save to frontend public directory
frontend_public_path = os.path.join("app", "frontend", "public", "stock_index.json")
os.makedirs(os.path.dirname(frontend_public_path), exist_ok=True)
with open(frontend_public_path, "w") as f:
    json.dump(stocks, f, indent=2)
print(f"Saved to frontend public: {os.path.abspath(frontend_public_path)}")

# Save to frontend src directory
frontend_src_path = os.path.join("app", "frontend", "src", "stock_index.json")
os.makedirs(os.path.dirname(frontend_src_path), exist_ok=True)
with open(frontend_src_path, "w") as f:
    json.dump(stocks, f, indent=2)
print(f"Saved to frontend src: {os.path.abspath(frontend_src_path)}")
