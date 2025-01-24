import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { fetchServices, analyzeService } from './api';
import { Service, ServiceClassification, FilterThresholds, SimulationParams } from './types';
import { ChatBox } from './components/chat/ChatBox';

function App() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<ServiceClassification | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [simulationParams, setSimulationParams] = useState<SimulationParams>({
    newFixedCosts: 0,
    newVariableCosts: 0,
    newRevenue: 0,
    newUsageCount: 0
  });
  const [filterThresholds, setFilterThresholds] = useState<FilterThresholds>({
    profitableMin: 40,
    optimizationMin: 20,
    unprofitableMax: 20
  });

  useEffect(() => {
    fetchServices().then(setServices).catch(console.error);
  }, []);

  const filterServices = (category: string) => {
    if (category === 'all') return services;
    return services.filter(service => service.category === category);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Profitable':
        return <TrendingUp className="text-green-500" />;
      case 'Optimization':
        return <AlertCircle className="text-yellow-500" />;
      case 'Unprofitable':
        return <TrendingDown className="text-red-500" />;
      default:
        return <BarChart />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ChatBox />
      
      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-[#2B2B2B] mb-8">Service Optimization Dashboard</h1>
        
        <Tabs defaultValue="all" className="mb-8" onValueChange={setSelectedCategory}>
          <TabsList className="bg-[#45B6B0] p-1 rounded-lg">
            <TabsTrigger value="all" className="text-white hover:bg-white/10">All Services</TabsTrigger>
            <TabsTrigger value="Profitable" className="text-white hover:bg-white/10">High Performance</TabsTrigger>
            <TabsTrigger value="Optimization" className="text-white hover:bg-white/10">Optimization Needed</TabsTrigger>
            <TabsTrigger value="Unprofitable" className="text-white hover:bg-white/10">Under Review</TabsTrigger>
          </TabsList>

          {/* Custom Thresholds */}
          <div className="mt-8 bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
            <div className="flex items-center mb-6">
              <div className="w-1 h-6 bg-[#45B6B0] rounded-full mr-3"></div>
              <h2 className="text-xl font-bold text-[#2B2B2B]">Performance Thresholds</h2>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm text-gray-600 mb-2">High Performance Minimum (%)</label>
                <input
                  type="number"
                  className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#45B6B0] focus:border-transparent"
                  value={filterThresholds.profitableMin}
                  onChange={(e) => setFilterThresholds({
                    ...filterThresholds,
                    profitableMin: parseFloat(e.target.value)
                  })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Optimization Threshold (%)</label>
                <input
                  type="number"
                  className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#45B6B0] focus:border-transparent"
                  value={filterThresholds.optimizationMin}
                  onChange={(e) => setFilterThresholds({
                    ...filterThresholds,
                    optimizationMin: parseFloat(e.target.value)
                  })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Review Threshold (%)</label>
                <input
                  type="number"
                  className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#45B6B0] focus:border-transparent"
                  value={filterThresholds.unprofitableMax}
                  onChange={(e) => setFilterThresholds({
                    ...filterThresholds,
                    unprofitableMax: parseFloat(e.target.value)
                  })}
                />
              </div>
            </div>
          </div>

          {/* Service Cards */}
          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterServices(selectedCategory).map((service) => (
                <Card key={service.id} className="overflow-hidden border-t-4 border-t-[#45B6B0]">
                  <CardHeader className="border-b border-gray-100 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold text-[#2B2B2B]">{service.name}</CardTitle>
                        <CardDescription className="text-gray-600 mt-1">{service.description}</CardDescription>
                      </div>
                      <div className={`p-2 rounded-full ${
                        service.category === 'Profitable' ? 'bg-green-100 text-green-600' :
                        service.category === 'Optimization' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {getCategoryIcon(service.category)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {/* Key Metrics */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Profit Margin</p>
                          <p className="text-2xl font-bold text-[#2B2B2B]">{service.metrics.profit_margin.toFixed(1)}%</p>
                          <p className={`text-xs mt-1 ${
                            service.metrics.profit_margin > filterThresholds.profitableMin ? 'text-green-600' :
                            service.metrics.profit_margin > filterThresholds.optimizationMin ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {service.metrics.profit_margin > filterThresholds.profitableMin ? 'High Performance' :
                             service.metrics.profit_margin > filterThresholds.optimizationMin ? 'Needs Optimization' :
                             'Under Review'}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Revenue</p>
                          <p className="text-2xl font-bold text-[#2B2B2B]">
                            ${service.metrics.revenue.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            ${(service.metrics.revenue / service.metrics.usage_count).toFixed(0)} per use
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Usage Count</p>
                          <p className="text-2xl font-bold text-[#2B2B2B]">{service.metrics.usage_count}</p>
                          <p className="text-xs text-gray-500 mt-1">Last 12 months</p>
                        </div>
                      </div>

                      {/* Performance Chart */}
                      <div className="bg-white rounded-lg p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium text-gray-600">Monthly Performance</h4>
                          <div className="flex items-center space-x-2 text-sm">
                            <span className={`flex items-center ${
                              service.performance.monthly_profits[11] > service.performance.monthly_profits[0]
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {service.performance.monthly_profits[11] > service.performance.monthly_profits[0]
                                ? <TrendingUp className="w-4 h-4 mr-1" />
                                : <TrendingDown className="w-4 h-4 mr-1" />
                              }
                              {Math.abs(((service.performance.monthly_profits[11] - service.performance.monthly_profits[0]) /
                                service.performance.monthly_profits[0]) * 100).toFixed(1)}% YoY
                            </span>
                          </div>
                        </div>
                        <LineChart
                          width={300}
                          height={200}
                          data={service.performance.monthly_profits.map((profit, index) => ({
                            month: index + 1,
                            profit
                          }))}
                          margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                          <XAxis 
                            dataKey="month" 
                            stroke="#666"
                            tickFormatter={(value) => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][value - 1]}
                          />
                          <YAxis 
                            stroke="#666"
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          />
                          <Tooltip 
                            formatter={(value: any) => [`$${parseInt(value).toLocaleString()}`, 'Profit']}
                            labelFormatter={(label: any) => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][label - 1]}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="profit" 
                            stroke="#45B6B0" 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </div>

                      {/* Seasonal Performance */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-600 mb-4">Seasonal Performance</h4>
                        <div className="grid grid-cols-4 gap-2">
                          {Object.entries(service.performance.seasonal_trends).map(([season, trend]) => (
                            <div 
                              key={season}
                              className={`text-center p-3 rounded ${
                                trend > 1.1 ? 'bg-green-100 text-green-800' :
                                trend < 0.9 ? 'bg-red-100 text-red-800' :
                                'bg-white text-gray-800 border border-gray-200'
                              }`}
                            >
                              <p className="text-xs font-medium capitalize mb-1">{season}</p>
                              <p className="text-sm font-bold">{((trend - 1) * 100).toFixed(1)}%</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Analyze Service Button */}
                      <button
                        onClick={async () => {
                          const newSelected = selectedService?.id === service.id ? null : service;
                          setSelectedService(newSelected);
                          if (newSelected) {
                            try {
                              const analysis = await analyzeService(newSelected);
                              setAiAnalysis(analysis);
                            } catch (err) {
                              console.error('Failed to analyze service:', err);
                              setAiAnalysis(null);
                            }
                          } else {
                            setAiAnalysis(null);
                          }
                        }}
                        className="w-full py-2 bg-[#45B6B0] text-white rounded-md hover:bg-[#3a9a95] transition-colors flex items-center justify-center space-x-2"
                      >
                        {selectedService?.id === service.id ? (
                          <>
                            <span>Close Analysis</span>
                          </>
                        ) : (
                          <>
                            <BarChart className="w-4 h-4" />
                            <span>Analyze Service</span>
                          </>
                        )}
                      </button>

                      {/* AI Recommendations */}
                      {selectedService?.id === service.id && aiAnalysis && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-[#2B2B2B]">AI Insights & Recommendations</h4>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              aiAnalysis.market_insights.market_position === 'Premium' ? 'bg-green-100 text-green-800' :
                              aiAnalysis.market_insights.market_position === 'Standard' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {aiAnalysis.market_insights.market_position} Position
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            {/* Performance Analysis */}
                            <div className="flex items-start space-x-3">
                              <div className="bg-gray-50 p-2 rounded">
                                <TrendingUp className="w-4 h-4 text-[#45B6B0]" />
                              </div>
                              <div>
                                <h5 className="text-sm font-medium text-gray-900">Performance Analysis</h5>
                                <p className="text-sm text-gray-600">
                                  Confidence Score: {aiAnalysis.confidence_score.toFixed(1)}%
                                </p>
                                <p className="text-sm text-gray-600">
                                  Profit Trend: {aiAnalysis.market_insights.profit_trend}
                                </p>
                              </div>
                            </div>

                            {/* Market Position */}
                            <div className="flex items-start space-x-3">
                              <div className="bg-gray-50 p-2 rounded">
                                <BarChart className="w-4 h-4 text-[#45B6B0]" />
                              </div>
                              <div>
                                <h5 className="text-sm font-medium text-gray-900">Market Position</h5>
                                <p className="text-sm text-gray-600">
                                  Revenue per use: ${aiAnalysis.market_insights.revenue_per_use.toFixed(0)}
                                </p>
                                {aiAnalysis.market_insights.scaling_recommended && (
                                  <p className="text-sm text-green-600 mt-1">
                                    ✓ Recommended for scaling
                                  </p>
                                )}
                                {aiAnalysis.market_insights.discontinuation_recommended && (
                                  <p className="text-sm text-red-600 mt-1">
                                    ⚠ Consider discontinuation
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Key Recommendations */}
                            <div className="flex items-start space-x-3">
                              <div className="bg-gray-50 p-2 rounded">
                                <AlertCircle className="w-4 h-4 text-[#45B6B0]" />
                              </div>
                              <div>
                                <h5 className="text-sm font-medium text-gray-900">Key Recommendations</h5>
                                <ul className="mt-1 space-y-1">
                                  {aiAnalysis.optimization_suggestions.map((suggestion: string, index: number) => (
                                    <li key={index} className="text-sm text-gray-600">
                                      {suggestion}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="Profitable" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterServices('Profitable').map((service) => (
                <Card key={service.id} className="overflow-hidden border-t-4 border-t-[#45B6B0]">
                  {/* Same card content as above */}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="Optimization" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterServices('Optimization').map((service) => (
                <Card key={service.id} className="overflow-hidden border-t-4 border-t-[#45B6B0]">
                  {/* Same card content as above */}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="Unprofitable" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterServices('Unprofitable').map((service) => (
                <Card key={service.id} className="overflow-hidden border-t-4 border-t-[#45B6B0]">
                  {/* Same card content as above */}
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
