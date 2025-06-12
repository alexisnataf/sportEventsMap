import React, { Component } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css'
import DatePicker from "react-datepicker"
import Select from 'react-select';
import makeAnimated from 'react-select/animated';

import "react-datepicker/dist/react-datepicker.css"

import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const animatedComponents = makeAnimated();

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

async function searchMatchBetweenDates(startDate, endDate) {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });
  const response = await fetch("http://localhost:3001/api/matchs/dates?" + params);
  return response.json();
}

async function fetchCoordsByMatchIds(matchIds) {
  const response = await fetch('http://localhost:3001/api/stadiums/coords', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchIds })
  });

  if (!response.ok) {
    throw new Error('Failed to fetch stadium coordinates');
  }

  return response.json();
}

async function fetchAllStadiums(){
  const response = await fetch("http://localhost:3001/api/stadiums");
  if (!response.ok) {
    throw new Error('Failed to fetch stadiums');
  }
  return response.json();
}

async function fetchSportsByMatchIds(matchIds){
  const response = await fetch('http://localhost:3001/api/sports/games', {
  method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchIds })
  });

  if (!response.ok) {
    throw new Error('Failed to fetch sports');
  }

  return response.json();
}


class App extends Component {
  constructor(props){
    super(props);
    this.init();
    this.performSearch = this.performSearch.bind(this);
    this.matchListRef = React.createRef();

    this.state = {
      startdate: new Date(),
      enddate: new Date(),
      matchList: [],
      markersList: [],
      sportsList: [],
      selectedSports: []
    } 
  }

  sportsOptions = [
  { value: 'truc', label: 'truc' },
  { value: 'machin', label: 'machin' }
  ];

  async performSearch() {
    const result = await searchMatchBetweenDates(this.state.startdate, this.state.enddate);
    this.setState({matchList: result});
    const matchIds = result.map(match => match.id);
    const marks = await fetchCoordsByMatchIds(matchIds);
    this.setState({
      markersList: marks.map(c => ({
        ...c,
        latitude: c.place.y,
        longitude: c.place.x
      }))
    });
    const sportsRes = await fetchSportsByMatchIds(matchIds);
    this.setState({sportsList:sportsRes});
  }
  
  async init(){
    const stadiumMarks = await fetchAllStadiums();
    this.setState({
      markersList: stadiumMarks.map(c => ({
        ...c,
        latitude: c.place.y,
        longitude: c.place.x
      }))
    });
  }

  render() {
     const matchesToDisplay = this.state.matchList.filter(
        (match) =>
          this.state.selectedSports.length === 0 ||
          this.state.selectedSports.includes(match.sport)
      );

      const markersToDisplay =
        matchesToDisplay.length > 0
          ? this.state.markersList.filter(marker =>
              matchesToDisplay.some(match => match.stade === marker.stade)
            )
          : this.state.markersList;

    return (
      <div className="container" >
        <div className="map" >
          <MapContainer
            center={[48.8566, 2.3522]}
            zoom={12.5}
            scrollWheelZoom={true}
            style={{width: "100%", height: "100%"}}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {markersToDisplay.map((element, index) => (
              <Marker key={index} position={[element.longitude, element.latitude]}>
              <Popup>
                {this.state.matchList.length > 0 ? (
                <>
                  <h2>{this.state.matchList[index]?.stade}</h2>
                  <h3>{this.state.matchList[index]?.teams[0].name} VS {this.state.matchList[index]?.teams[1].name}</h3>
                  <p>Compétition : {this.state.matchList[index]?.competition}</p>
                </>
              ) : (
                <h2>{element.stade}</h2>
              )}  
              </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        <div className="list">
              <h2>Période</h2>
              Entre <DatePicker dateFormat="dd/MM/yyyy" selected={this.state.startdate} onChange={(date) => this.setState({startdate: date})} />
              <br/>
              Et <DatePicker dateFormat="dd/MM/yyyy" selected={this.state.enddate} onChange={(date) => this.setState({enddate: date})} />
                <br/>
              <button onClick={this.performSearch}>Rechercher</button>
              <br/>

              {this.state.sportsList.length > 0 && (
                <>
                  <h2>Sports</h2>
                  <Select
                    closeMenuOnSelect={false}
                    components={animatedComponents}
                    isMulti
                    options={
                      Array.from(
                        new Set(this.state.sportsList.map((sprt) => sprt.sport))
                      ).map((sport) => ({
                        value: sport,
                        label: sport
                      }))
                    }
                    onChange={(selected) =>
                      this.setState({ selectedSports: selected.map((s) => s.value) })
                    }
                    value={this.state.sportsList
                      .filter((sprt) => this.state.selectedSports.includes(sprt.sport))
                      .map((sprt) => ({
                        value: sprt.sport,
                        label: sprt.sport
                      }))
                    }
                  />
                </>
              )}
              
            
             
            
            

          <h3>Matchs</h3>
          <ul>
            {matchesToDisplay.map((element, index) => (
            <li key={index}>
              <div className="game">
                <p>Stade : {element.stade}</p>
                <p>Compétition : {element.competition}</p>
                <p>{element.teams[0].name} VS {element.teams[1].name}</p>
              </div>
            </li>
          ))}
          </ul>
        </div>
      </div>
    );
  }
}

export default App;
