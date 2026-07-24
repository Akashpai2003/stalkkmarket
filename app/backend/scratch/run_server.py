import uvicorn
import sys
import traceback

if __name__ == "__main__":
    print("Starting uvicorn programmatically...")
    try:
        uvicorn.run("main:app", host="127.0.0.1", port=8000, log_level="debug")
    except Exception as e:
        print("EXCEPTION OCCURRED:", e, file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
