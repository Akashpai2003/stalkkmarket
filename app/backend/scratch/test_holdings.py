import asyncio
from main import get_portfolio_stats

async def main():
    res = await get_portfolio_stats()
    print("KEYS:", res.keys())
    if "holdings" in res:
        print("HOLDINGS:", res["holdings"])
        if isinstance(res["holdings"], list):
            print("ITEMS:", [type(item) for item in res["holdings"]])
        elif isinstance(res["holdings"], dict):
            print("KEYS OF HOLDINGS DICT:", res["holdings"].keys())
            h_list = res["holdings"].get("holdings", [])
            print("TYPE of holdings key list:", type(h_list))
            if h_list:
                print("FIRST ITEM TYPE:", type(h_list[0]))
                print("FIRST ITEM:", h_list[0])

if __name__ == "__main__":
    asyncio.run(main())
