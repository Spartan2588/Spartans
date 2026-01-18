from api.database import engine, Base
from api import models

def init_db():
    print("Initializing database...")
    Base.metadata.create_all(bind=engine)
    print("Database initialization complete.")

if __name__ == "__main__":
    init_db()
