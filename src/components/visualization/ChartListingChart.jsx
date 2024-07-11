import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { subDays } from 'date-fns';
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';

const CarListingsChart = ({ data }) => {
  const svgRef = useRef();
  const [filteredData, setFilteredData] = useState(data);
  const [filter, setFilter] = useState('last 7 days');

  const filters = [
    'last 7 days',
    'last 30 days',
    'last 90 days',
    'last 1 year'
  ];

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const parentWidth = svgRef.current.parentNode.clientWidth;

    const width = parentWidth;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 70, left: 60 };


    let xTickValues;
    let startDate;
    let numDays;

    switch (filter) {
      case 'last 7 days':
        startDate = subDays(new Date(), 7);
        numDays = 7;
        xTickValues = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        break;
      case 'last 30 days':
      case 'last 90 days':
      case 'last 1 year':
        startDate = subDays(new Date(), filter === 'last 30 days' ? 30 : filter === 'last 90 days' ? 90 : 365);
        numDays = filter === 'last 30 days' ? 30 : filter === 'last 90 days' ? 90 : 365;
        xTickValues = ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov', 'Dec'];
        break;
      default:
        startDate = subDays(new Date(), 7);
        numDays = 7;
        xTickValues = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    }


    const filteredDataByDate = data.filter(d => new Date(d.date) >= startDate);


    const dataWithDays = filteredDataByDate.map(d => ({
      ...d,
      day: Math.floor((new Date(d.date) - startDate) / (1000 * 60 * 60 * 24)) + 1,
    }));


    const maxCount = d3.max(dataWithDays, d => d.count) || 0;
    const yMax = maxCount < 100 ? 100 : maxCount + 100;
    const yInterval = maxCount < 100 ? 10 : 100;

    const x = d3.scaleLinear()
      .domain([1, numDays])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, yMax])
      .range([height - margin.bottom, margin.top]);

    const xAxis = svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(xTickValues.length).tickFormat((d, i) => xTickValues[i]));

    xAxis.append('text')
      .attr('x', width / 2)
      .attr('y', 50)
      .attr('fill', 'black')
      .attr('text-anchor', 'middle')
      .text('Date');

    const yAxis = svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(yMax / yInterval))
      .append('text')
      .attr('x', -height / 2)
      .attr('y', -50)
      .attr('fill', 'black')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .text('Count');

    const line = d3.line()
      .x(d => x(d.day))
      .y(d => y(d.count));

    svg.append('path')
      .datum(dataWithDays)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2)
      .attr('d', line);



    svg.selectAll('circle')
      .data(dataWithDays)
      .enter()
      .append('circle')
      .attr('cx', d => x(d.day))
      .attr('cy', d => y(d.count))
      .attr('r', 4)
      .attr('fill', 'steelblue');

  }, [filteredData, filter]);

  const handleFilterChange = (option) => {
    setFilter(option.value);
    const now = new Date();
    let startDate;
    switch (option.value) {
      case 'last 7 days':
        startDate = subDays(now, 7);
        break;
      case 'last 30 days':
        startDate = subDays(now, 30);
        break;
      case 'last 90 days':
        startDate = subDays(now, 90);
        break;
      case 'last 1 year':
        startDate = subDays(now, 365);
        break;
      default:
        startDate = subDays(now, 7);
    }
    const newData = data.filter(d => new Date(d.date) >= startDate);
    setFilteredData(newData);
  };

  return (
    <div style={{ width: '100%', boxShadow: "-1px 2px 5px 0px rgba(0,0,0,0.75)", padding: "2rem" }}>
      <div>
        <p style={{
          fontSize:"20px",
          textAlign:"center"
        }}>Car Listing Chart</p>
      </div>
      <div style={{ width: "150px", float: "right" }}>
        <Dropdown options={filters} onChange={handleFilterChange} value={filter} placeholder="Select a filter" />
      </div>
      <svg style={{
        border: "1px solid #004080",
        marginTop: "20px"
      }} ref={svgRef} width="100%" height={400}></svg>
    </div>
  );
};

export default CarListingsChart;
