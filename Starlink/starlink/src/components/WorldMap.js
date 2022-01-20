import React, {Component} from 'react';
import axios from 'axios';
import { Spin } from "antd";
import { feature } from "topojson-client";
import { geoKavrayskiy7 } from 'd3-geo-projection';
import { geoGraticule, geoPath } from 'd3-geo';
import { select as d3Select } from 'd3-selection';
import { schemeCategory10 } from "d3-scale-chromatic";
import * as d3Scale from "d3-scale";
import { timeFormat as d3TimeFormat } from "d3-time-format";

import { WORLD_MAP_URL, SATELLITE_POSITION_URL, SAT_API_KEY } from '../constants';

const width = 960;
const height = 600;

class WorldMap extends Component {
    constructor() {
        super();
        this.refMap = React.createRef();
        this.refTrack = React.createRef();
        this.map = null;
        this.color = d3Scale.scaleOrdinal(schemeCategory10);
        this.state = {
            // to ensure user cannot choose satellite while drawing picture and loading data
            isLoading: false,
            isDrawing: false
        }
    }

    componentDidMount() {
        axios
            .get(WORLD_MAP_URL)
            .then( res => {
                console.log(res);
                const { data } =res;
                const land = feature(data, data.objects.countries).features;
                //console.log(land);
                this.generateMap(land);
            })
            .catch( err => {
                console.log(`err in fetching map data ${err}`)
            })
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.satData !== this.props.satData) {
            const {
                latitude,
                longitude,
                elevation,
                altitude,
                duration
            } = this.props.observerData;
            const endTime = duration * 60;

            this.setState({
                isLoading: true
            });

            // step1: prepare for urls
            const urls = this.props.satData.map(sat => {
                const { satid } = sat;
                const url = `/api/${SATELLITE_POSITION_URL}/${satid}/${latitude}/${longitude}/${elevation}/${endTime}/&apiKey=${SAT_API_KEY}`;

                return axios.get(url);
            });
            //console.log("urls in map -> ",urls)

            // step2: parse sats positions
            // axios.all(urls)
            //     .then(
            //         axios.spread((...args) => {
            //             return args.map(item => item.data);
            //         })
            //     )
            //     .then(response => {
            //         console.log('response ->', response);
            //     })
            //     .catch( err => {
            //         console.log("err in fetch satellite position", err);
            //     })
            Promise.all(urls)
                .then( results => {
                    //console.log('->', results);
                    const arr = results.map(sat => sat.data);
                    //console.log('arr -> ', arr);

                    this.setState({
                        isLoading: false,
                        isDrawing: true
                    })

                    // case1: isdrawing true -> cannot track
                    // case2: isdrawing false -> track
                    // drawing position
                    if (!prevState.isDrawing) {
                        this.track(arr);
                    } else {
                        const oHint = document.getElementsByClassName("hint")[0];
                        oHint.innerHTML =
                            "Please wait for these satellite animation to finish before selection new ones!";
                    }
                })
                .catch( e => {
                    console.log('failed ->', e);
                })
        }
    }

    track = data => {
        // canvas2
        if (!data || !data[0].hasOwnProperty('positions')) {
            throw new Error("no position data");
            return;
        }

        const len = data[0].positions.length;
        const { duration } = this.props.observerData;
        const { context2 } = this.map;

        let now = new Date();
        let i = 0;

        let timer = setInterval( () => {
            let ct = new Date();

            let timePassed = i === 0 ? 0 : ct - now;
            let time = new Date(now.getTime() + 60 * timePassed);

            context2.clearRect(0, 0, width, height);

            context2.font = "bold 14px sans-serif";
            context2.fillStyle = "#333333";
            context2.textAlign = "center";
            context2.fillText(d3TimeFormat(time), width / 2, 13);

            // clear satimage while time is longer than duration
            if (i >= len ) {
                clearInterval();
                this.setState({ isDrawing: false });
                const oHint = document.getElementsByClassName("hint")[0];
                oHint.innerHTML = "";
                return;
            }

            data.forEach( sat => {
                const { positions, info } = sat;
                this.drawSat(info, positions[i]);
            })

            i += 60;
        }, 1000)


    }

    drawSat = (sat, pos) => {
        const { satlongitude, satlatitude } = pos;
        if (!satlongitude || !satlatitude) return;

        const { satname } = sat;
        const name = satname.match(/\d+/g).join("");

        const { projection, context2 } = this.map;

        const xy = projection([satlongitude, satlatitude]);
        context2.fillStyle = this.color(name);
        context2.beginPath();
        context2.arc(xy[0], xy[1], 4, 0, 2 * Math.PI);
        context2.fill();
        context2.font = "bold 11px sans-serif";
        context2.textAlign = "center";
        context2.fillText(name, xy[0], xy[1] + 14);

    }

    generateMap = land => {
        const projection = geoKavrayskiy7()
            .scale(170)
            .translate([width / 2, height / 2])
            .precision(.1);

        //console.log(projection)
        const graticule = geoGraticule();

        const canvas = d3Select(this.refMap.current)
            .attr("width", width)
            .attr("height", height);

        const canvas2 = d3Select(this.refTrack.current)
            .attr("width", width)
            .attr("height", height);

        const context = canvas.node().getContext("2d");
        const context2 = canvas2.node().getContext("2d");

        let path = geoPath().projection(projection).context(context);

        land.forEach( ele => {
            context.fillStyle = '#B3DDEF';
            context.strokeStyle = '#000';
            context.globalAlpha = 0.7;
            context.beginPath();
            path(ele);
            context.fill();
            context.stroke();

            context.strokeStyle = 'rgba(220, 220, 220, 0.1)';
            context.beginPath();
            path(graticule());
            context.lineWidth = 0.1;
            context.stroke();

            context.beginPath();
            context.lineWidth = 0.5;
            path(graticule.outline());
            context.stroke();
        })

        this.map = {
            graticule: graticule,
            context: context,
            context2: context2,
            projection: projection
        }
    }

    render() {
        const { isLoading } = this.state;
        return (
            <div className="map-box">
                {isLoading ? (
                    <div className="spinner">
                        <Spin tip="Loading..." size="large" />
                    </div>
                ) : null}
                <canvas className="map" ref={this.refMap}></canvas>
                <canvas className="track" ref={this.refTrack}></canvas>
                <div className="hint" />
            </div>
        );
    }
}

export default WorldMap;