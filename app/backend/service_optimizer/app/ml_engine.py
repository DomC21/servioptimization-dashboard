import numpy as np
from sklearn.ensemble import RandomForestClassifier
from typing import List, Dict, Any

class ServiceOptimizationEngine:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.forecasting_models = {}  # Store Prophet models for each service
        
    def forecast_profitability(self, service: Dict[str, Any], periods: int = 12) -> Dict[str, Any]:
        """Forecast service profitability for the next N periods"""
        from prophet import Prophet
        import pandas as pd
        
        # Prepare historical data
        monthly_profits = service['performance']['monthly_profits']
        dates = pd.date_range(end=pd.Timestamp.now(), periods=len(monthly_profits), freq='M')
        
        # Create Prophet DataFrame
        df = pd.DataFrame({
            'ds': dates,
            'y': monthly_profits
        })
        
        # Initialize and fit Prophet model
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=False,
            daily_seasonality=False,
            seasonality_mode='multiplicative'
        )
        model.fit(df)
        
        # Generate future dates
        future = model.make_future_dataframe(periods=periods, freq='M')
        
        # Make predictions
        forecast = model.predict(future)
        
        # Store model for future use
        self.forecasting_models[service['id']] = model
        
        # Extract relevant metrics and seasonality
        seasonality_df = pd.DataFrame({
            'ds': pd.date_range(start='2024-01-01', periods=12, freq='M'),
            'seasonal': model.predict(pd.DataFrame({
                'ds': pd.date_range(start='2024-01-01', periods=12, freq='M')
            }))['yearly']
        })
        
        results = {
            'dates': forecast['ds'].tail(periods).dt.strftime('%Y-%m').tolist(),
            'predicted_profits': forecast['yhat'].tail(periods).round(2).tolist(),
            'lower_bound': forecast['yhat_lower'].tail(periods).round(2).tolist(),
            'upper_bound': forecast['yhat_upper'].tail(periods).round(2).tolist(),
            'trend': forecast['trend'].tail(periods).round(2).tolist(),
            'seasonal_pattern': {
                'yearly': seasonality_df['seasonal'].tolist()
            }
        }
        
        return results

    def prepare_features(self, service: Dict[str, Any]) -> np.ndarray:
        """Extract relevant features for classification"""
        features = [
            service['metrics']['profit_margin'],
            np.mean(service['performance']['monthly_profits']),
            np.std(service['performance']['monthly_profits']),
            service['metrics']['usage_count'],
            service['resources']['contractor_count']
        ]
        return np.array(features).reshape(1, -1)
    
    def calculate_profit_margin(self, service: Dict[str, Any]) -> float:
        """Calculate profit margin using revenue and costs"""
        revenue = service['metrics']['revenue']
        total_costs = service['costs']['fixed_costs'] + service['costs']['variable_costs']
        return (revenue - total_costs) / revenue * 100

    def calculate_confidence(self, profit_margin: float, threshold_distance: float) -> float:
        """Calculate confidence score based on distance from threshold"""
        base_confidence = 0.8
        confidence_boost = min(0.15, threshold_distance * 0.01)
        return base_confidence + confidence_boost

    def check_discontinuation_criteria(self, service: Dict[str, Any]) -> tuple:
        """Check if service meets discontinuation criteria"""
        revenue = service['metrics']['revenue']
        fixed_costs = service['costs']['fixed_costs']
        total_costs = fixed_costs + service['costs']['variable_costs']
        monthly_profits = service['performance']['monthly_profits']
        profit_margin = self.calculate_profit_margin(service)
        
        revenue_below_fixed_costs = revenue < fixed_costs * 1.5
        low_profit_margin = profit_margin < 15
        declining_profits = monthly_profits[-1] < monthly_profits[0]
        recent_profits = monthly_profits[-3:]
        consistently_unprofitable = all(profit < total_costs * 0.1 for profit in recent_profits)
        
        should_discontinue = (
            (revenue_below_fixed_costs and consistently_unprofitable) or
            (low_profit_margin and declining_profits and consistently_unprofitable)
        )
        
        reasons = []
        if revenue_below_fixed_costs:
            reasons.append(f"Revenue (${revenue:,.2f}) barely covers fixed costs (${fixed_costs:,.2f})")
        if low_profit_margin:
            reasons.append(f"Very low profit margin ({profit_margin:.1f}%)")
        if declining_profits:
            profit_decline = ((monthly_profits[0] - monthly_profits[-1]) / monthly_profits[0]) * 100
            reasons.append(f"Declining profits ({profit_decline:.1f}% decrease)")
        if consistently_unprofitable:
            avg_recent_profit = sum(recent_profits) / len(recent_profits)
            reasons.append(f"Consistently low profits (avg ${avg_recent_profit:,.2f} last 3 months)")
        
        reason = " | ".join(reasons) if should_discontinue else None
        
        return should_discontinue, reason

    def check_scaling_criteria(self, service: Dict[str, Any]) -> tuple:
        """Check if service is suitable for increased marketing/scaling"""
        profit_margin = self.calculate_profit_margin(service)
        monthly_profits = service['performance']['monthly_profits']
        revenue = service['metrics']['revenue']
        usage_count = service['metrics']['usage_count']
        
        profit_volatility = np.std(monthly_profits) / np.mean(monthly_profits)
        profit_trend = (monthly_profits[-1] - monthly_profits[0]) / monthly_profits[0] * 100
        revenue_per_usage = revenue / usage_count
        
        high_margin = profit_margin > 40
        stable_profits = profit_volatility < 0.15
        growing_profits = profit_trend > 10
        good_usage = usage_count > 20
        high_value = revenue_per_usage > 1000
        
        should_scale = (
            high_margin and 
            stable_profits and 
            (growing_profits or (high_value and good_usage))
        )
        
        reasons = []
        if high_margin:
            reasons.append(f"Strong profit margin ({profit_margin:.1f}%)")
        if stable_profits:
            reasons.append(f"Stable profits (volatility: {profit_volatility:.2f})")
        if growing_profits:
            reasons.append(f"Growing profits ({profit_trend:+.1f}% trend)")
        if good_usage:
            reasons.append(f"Good usage levels ({usage_count} uses)")
        if high_value:
            reasons.append(f"High value per use (${revenue_per_usage:,.2f})")
        
        reason = " | ".join(reasons) if should_scale else None
        
        return should_scale, reason

    def classify_service(self, service: Dict[str, Any]) -> tuple:
        """Classify service and return category with confidence score"""
        profit_margin = self.calculate_profit_margin(service)
        
        if profit_margin > 40:
            category = "Profitable"
            threshold_distance = profit_margin - 40
        elif profit_margin >= 20:
            category = "Optimization"
            threshold_distance = min(profit_margin - 20, 40 - profit_margin)
        else:
            category = "Unprofitable"
            threshold_distance = 20 - profit_margin
            
        confidence = self.calculate_confidence(profit_margin, threshold_distance)
        
        monthly_profits = service['performance']['monthly_profits']
        profit_volatility = np.std(monthly_profits) / np.mean(monthly_profits)
        if profit_volatility > 0.2:
            confidence *= 0.9
        
        should_discontinue, discontinue_reason = self.check_discontinuation_criteria(service)
        should_scale, scale_reason = self.check_scaling_criteria(service)
            
        return category, confidence, should_discontinue, should_scale
    
    def generate_optimization_suggestions(self, service: Dict[str, Any]) -> List[str]:
        """Generate optimization suggestions based on service data"""
        suggestions = []
        profit_margin = self.calculate_profit_margin(service)
        monthly_profits = service['performance']['monthly_profits']
        
        fixed_costs = service['costs']['fixed_costs']
        variable_costs = service['costs']['variable_costs']
        revenue = service['metrics']['revenue']
        
        if profit_margin < 40:
            if variable_costs > fixed_costs * 1.5:
                suggestions.append("High variable costs - optimize contractor utilization")
            if fixed_costs > revenue * 0.3:
                suggestions.append("High fixed costs relative to revenue - review operational efficiency")
                
        profit_volatility = np.std(monthly_profits) / np.mean(monthly_profits)
        if profit_volatility > 0.2:
            suggestions.append("High profit volatility - investigate seasonal patterns")
            
        profit_trend = monthly_profits[-1] - monthly_profits[0]
        if profit_trend < 0:
            suggestions.append("Declining profit trend - review pricing and cost structure")
            
        revenue_per_contractor = revenue / service['resources']['contractor_count']
        if revenue_per_contractor < 10000:
            suggestions.append("Low revenue per contractor - optimize resource allocation")
                
        return suggestions
