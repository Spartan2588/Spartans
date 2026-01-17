"""
Analytics Helper Module
Provides common analytics functions for querying the urban intelligence database.
"""

import pandas as pd
import sqlite3
from datetime import datetime, timedelta


class AnalyticsHelper:
    """Helper class for common analytics queries on the urban intelligence database."""

    def __init__(self, db_path='urban_intelligence.db'):
        self.db_path = db_path
        self.conn = None

    def connect(self):
        """Establish database connection."""
        self.conn = sqlite3.connect(self.db_path)
        return self.conn

    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()

    def get_cross_domain_daily(self, start_date=None, end_date=None, limit=100):
        """Get daily cross-domain analytics."""
        query = "SELECT * FROM analytics_daily WHERE 1=1"

        if start_date:
            query += f" AND date >= '{start_date}'"
        if end_date:
            query += f" AND date <= '{end_date}'"

        query += " ORDER BY date DESC LIMIT ?"

        df = pd.read_sql_query(query, self.conn, params=(limit,))
        df['date'] = pd.to_datetime(df['date'])
        return df

    def get_traffic_aq_correlation(self, city=None, start_date=None, end_date=None):
        """Get correlation between traffic and air quality."""
        query = """
            SELECT 
                t.date,
                t.avg_traffic_congestion_index,
                aq.avg_aqi_severity_score,
                aq.city,
                aq.state
            FROM traffic_daily t
            JOIN air_quality_daily aq ON t.date = aq.date
            WHERE 1=1
        """

        if city:
            query += f" AND LOWER(aq.city) = LOWER('{city}')"
        if start_date:
            query += f" AND t.date >= '{start_date}'"
        if end_date:
            query += f" AND t.date <= '{end_date}'"

        query += " ORDER BY t.date DESC"

        df = pd.read_sql_query(query, self.conn)
        df['date'] = pd.to_datetime(df['date'])
        return df

    def get_respiratory_trends(self, geographic_aggregation=None, start_date=None, end_date=None):
        """Get respiratory health trends."""
        query = """
            SELECT 
                week_ending_date as date,
                geographic_aggregation,
                total_respiratory_cases,
                respiratory_risk_index,
                total_covid19_cases,
                total_influenza_cases,
                total_rsv_cases,
                bed_occupancy_percent
            FROM respiratory_weekly
            WHERE 1=1
        """

        if geographic_aggregation:
            query += f" AND geographic_aggregation = '{geographic_aggregation}'"
        if start_date:
            query += f" AND week_ending_date >= '{start_date}'"
        if end_date:
            query += f" AND week_ending_date <= '{end_date}'"

        query += " ORDER BY week_ending_date DESC"

        df = pd.read_sql_query(query, self.conn)
        df['date'] = pd.to_datetime(df['date'])
        return df

    def get_agriculture_volatility(self, commodity=None, state=None, start_date=None, end_date=None):
        """Get agriculture price volatility metrics."""
        query = """
            SELECT 
                date,
                state,
                district,
                market_name,
                commodity,
                modal_price,
                price_range,
                price_volatility,
                price_volatility_30d,
                price_change_pct
            FROM agriculture_daily
            WHERE price_volatility_30d IS NOT NULL
        """

        if commodity:
            query += f" AND LOWER(commodity) = LOWER('{commodity}')"
        if state:
            query += f" AND LOWER(state) = LOWER('{state}')"
        if start_date:
            query += f" AND date >= '{start_date}'"
        if end_date:
            query += f" AND date <= '{end_date}'"

        query += " ORDER BY date DESC, price_volatility_30d DESC"

        df = pd.read_sql_query(query, self.conn)
        df['date'] = pd.to_datetime(df['date'])
        return df

    def get_top_volatile_commodities(self, limit=10):
        """Get top volatile commodities by average 30-day volatility."""
        query = f"""
            SELECT 
                commodity,
                COUNT(*) as records,
                AVG(price_volatility_30d) as avg_volatility,
                AVG(modal_price) as avg_price,
                MIN(modal_price) as min_price,
                MAX(modal_price) as max_price
            FROM agriculture_daily
            WHERE price_volatility_30d IS NOT NULL
            GROUP BY commodity
            ORDER BY avg_volatility DESC
            LIMIT {limit}
        """

        df = pd.read_sql_query(query, self.conn)
        return df

    def get_city_aqi_trends(self, city=None, state=None, start_date=None, end_date=None):
        """Get AQI trends for specific city/state."""
        query = """
            SELECT 
                date,
                city,
                state,
                avg_us_aqi,
                avg_aqi_severity_score,
                avg_pm2_5,
                avg_pm10,
                avg_no2,
                avg_o3,
                aqi_severity_category
            FROM air_quality_daily
            WHERE 1=1
        """

        if city:
            query += f" AND LOWER(city) = LOWER('{city}')"
        if state:
            query += f" AND LOWER(state) = LOWER('{state}')"
        if start_date:
            query += f" AND date >= '{start_date}'"
        if end_date:
            query += f" AND date <= '{end_date}'"

        query += " ORDER BY date DESC"

        df = pd.read_sql_query(query, self.conn)
        df['date'] = pd.to_datetime(df['date'])
        return df

    def get_summary_statistics(self):
        """Get summary statistics across all domains."""
        stats = {}

        # Traffic stats
        query = "SELECT COUNT(*) as count, MIN(date) as min_date, MAX(date) as max_date FROM traffic_daily"
        stats['traffic'] = pd.read_sql_query(query, self.conn).iloc[0].to_dict()

        # Air quality stats
        query = "SELECT COUNT(*) as count, MIN(date) as min_date, MAX(date) as max_date FROM air_quality_daily"
        stats['air_quality'] = pd.read_sql_query(query, self.conn).iloc[0].to_dict()

        # Respiratory stats
        query = "SELECT COUNT(*) as count, MIN(week_ending_date) as min_date, MAX(week_ending_date) as max_date FROM respiratory_weekly"
        stats['respiratory'] = pd.read_sql_query(query, self.conn).iloc[0].to_dict()

        # Agriculture stats
        query = "SELECT COUNT(*) as count, MIN(date) as min_date, MAX(date) as max_date FROM agriculture_daily"
        stats['agriculture'] = pd.read_sql_query(query, self.conn).iloc[0].to_dict()

        # Analytics stats
        query = "SELECT COUNT(*) as count, MIN(date) as min_date, MAX(date) as max_date FROM analytics_daily"
        stats['analytics'] = pd.read_sql_query(query, self.conn).iloc[0].to_dict()

        return stats


def main():
    """Example usage of AnalyticsHelper."""
    helper = AnalyticsHelper()
    helper.connect()

    try:
        print("=" * 60)
        print("Urban Intelligence Platform - Analytics Helper")
        print("=" * 60)

        # Get summary statistics
        print("\n1. Summary Statistics:")
        stats = helper.get_summary_statistics()
        for domain, stat in stats.items():
            print(f"\n{domain.upper()}:")
            print(f"  Records: {stat['count']:,}")
            print(f"  Date Range: {stat['min_date']} to {stat['max_date']}")

        # Get cross-domain daily analytics
        print("\n2. Cross-Domain Daily Analytics (Last 7 days):")
        analytics = helper.get_cross_domain_daily(limit=7)
        print(analytics[['date', 'avg_traffic_congestion_index', 'avg_aqi_severity_score', 
                        'avg_respiratory_risk_index', 'avg_price_volatility']].head())

        # Get top volatile commodities
        print("\n3. Top 10 Volatile Commodities:")
        volatile = helper.get_top_volatile_commodities(limit=10)
        print(volatile[['commodity', 'records', 'avg_volatility', 'avg_price']].head(10))

    except Exception as e:
        print(f"\nError: {str(e)}")
        import traceback
        traceback.print_exc()

    finally:
        helper.close()


if __name__ == '__main__':
    main()
