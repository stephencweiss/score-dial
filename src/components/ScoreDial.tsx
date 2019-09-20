import React, { useState } from 'react';

const defaultSize = {
    width: '100%',
    height: '100%',
};
const RADIUS = 44; // !Attention! Changing radius _will_ break this SVG unless the points along the circumference (i.e. startX, startY, etc) are adjusted accordingly
const ORIGIN = {
    X: 50,
    Y: 50,
};
const MIN_SCORE = 0;
const MAX_SCORE = 1000;
const UNKNOWN_SCORE = new Error(`Score is outside of accepted range`);

export enum Rating {
    VERYHIGH = 'Very High',
    HIGH = 'High',
    MEDIUM = 'Medium',
    LOW = 'Low',
    VERYLOW = 'Very LOW',
}

export enum RatingThreshold {
    VERYHIGH = 850,
    HIGH = 750,
    MEDIUM = 650,
    LOW = 450,
    VERYLOW = MIN_SCORE,
}

const getThreshold = (score: number) => {
    if (score >= RatingThreshold.VERYLOW && score < RatingThreshold.LOW) return RatingThreshold.VERYLOW;
    else if (score >= RatingThreshold.LOW && score < RatingThreshold.MEDIUM) return RatingThreshold.LOW;
    else if (score >= RatingThreshold.MEDIUM && score < RatingThreshold.HIGH) return RatingThreshold.MEDIUM;
    else if (score >= RatingThreshold.HIGH && score < RatingThreshold.VERYHIGH) return RatingThreshold.HIGH;
    else if (score >= RatingThreshold.VERYHIGH && score <= MAX_SCORE) return RatingThreshold.VERYHIGH;
    else throw UNKNOWN_SCORE;
};

const interpretScore = (score: number) => {
    if (score >= RatingThreshold.VERYHIGH)
        return {
            rating: Rating.VERYHIGH,
            highlight: '#41d895',
            startingInternalAngle: 0.199927, // (11.455 / 180) * Math.PI,
            endingInternalAngle: -0.4398229715, // (-25.2) / 180 * Math.PI
            rangeStart: RatingThreshold.VERYHIGH,
            rangeEnd: MAX_SCORE,
        };
    else if (score >= RatingThreshold.HIGH)
        return {
            rating: Rating.HIGH,
            highlight: '#7dbb42',
            startingInternalAngle: 0.645458, // ((205.2 - 168.218) / 180) * Math.PI,
            endingInternalAngle: 0.33197907702, // (19.021 / 180) * Math.PI
            rangeStart: RatingThreshold.HIGH,
            rangeEnd: RatingThreshold.VERYHIGH - 1,
        };
    else if (score >= RatingThreshold.MEDIUM)
        return {
            rating: Rating.MEDIUM,
            highlight: '#FFD324',
            startingInternalAngle: 1.154972, // ((205.2 - 139.025) / 180) * Math.PI,
            endingInternalAngle: 0.77750927518, // (44.548 / 180) * Math.PI
            rangeStart: RatingThreshold.MEDIUM,
            rangeEnd: RatingThreshold.HIGH,
        };
    else if (score >= RatingThreshold.LOW)
        return {
            rating: Rating.LOW,
            highlight: '#f4743b',
            startingInternalAngle: 1.664468, // ((205.2 - 109.833) / 180) * Math.PI,
            endingInternalAngle: 1.2870232437, // (73.741 / 180) * Math.PI
            rangeStart: RatingThreshold.LOW,
            rangeEnd: RatingThreshold.MEDIUM,
        };
    else if (score >= RatingThreshold.VERYLOW)
        return {
            rating: Rating.VERYLOW,
            highlight: '#EF2D56',
            startingInternalAngle: 3.5814156251, // (205.2 / 180) * Math.PI,
            endingInternalAngle: 1.7965372122, // (102.934 / 180) * Math.PI
            rangeStart: RatingThreshold.VERYLOW,
            rangeEnd: RatingThreshold.LOW,
        };
    else throw UNKNOWN_SCORE;
};

const calculateDistancePerIncrementalPoint = (score: number) => {
    // Note: This is included because of the weirdness that the gaps introduce
    // This calculation enforces a consistency of travel within each section for an incremental point in score
    const { startingInternalAngle, endingInternalAngle, rangeStart, rangeEnd } = interpretScore(score);
    const range = rangeEnd - rangeStart;
    const distanceTraveled = Math.abs(endingInternalAngle - startingInternalAngle);
    const distancePerPoint = distanceTraveled / range;
    return distancePerPoint;
};

const calculateInternalAngle = (score: number) => {
    // The internal angle is the angle from 0° in radians
    const distancePerIncrementalPoint = calculateDistancePerIncrementalPoint(score);
    const { startingInternalAngle } = interpretScore(score);
    const distanceToTravel = (score - getThreshold(score)) * distancePerIncrementalPoint;
    const internalAngle = startingInternalAngle - distanceToTravel;
    return internalAngle;
};

const calculateEdgeCoordinates = (internalAngle: number)=> {
    // Uses the Parametric Equation for a circle: https://stackoverflow.com/a/839931/9888057
    const xCoord = ORIGIN.X + RADIUS * Math.cos(internalAngle);
    const yCoord = ORIGIN.Y - RADIUS * Math.sin(internalAngle);
    return { xCoord, yCoord };
};

const partialStroke = (score: number, highlight: string) => {
    const { xCoord: startX, yCoord: startY } = calculateEdgeCoordinates(calculateInternalAngle(getThreshold(score)));
    const { xCoord: finalX, yCoord: finalY } = calculateEdgeCoordinates(calculateInternalAngle(score));

    return (
        <path
            d={`M ${startX} ${startY} A ${RADIUS} ${RADIUS} 0 0 1 ${finalX} ${finalY}`}
            stroke={highlight}
            fill="none"
            stroke-width="4"
            stroke-linecap="round"
        />
    );
};

const ScoreDial = (props: { score: number }) => {
    const [score, setScore] = useState(MIN_SCORE);
    if (Math.ceil(score) < props.score) {
        setTimeout(() => setScore(Math.ceil((props.score - score) / 50 + score)), 10);
    }

    const { rating, highlight } = interpretScore(score);
    const { xCoord: circleX, yCoord: circleY } = calculateEdgeCoordinates(calculateInternalAngle(score));

    return (
        <svg style={defaultSize} viewBox="0 0 100 80" className="ScoreDial-dial" aria-labelledby="title">
            <title>Score</title>

            {/* This is the grey, unfilled portion of the dial, i.e. the background */}
            <g>
                <g>
                    {/* Very LOW */}
                    <path
                        d={`M 10.187609691495148 68.73428882886321 A ${RADIUS} ${RADIUS} 0 0 1 40.15168157318339 7.116312843179813`}
                        stroke="#E1E7EB"
                        fill="none"
                        stroke-width="4"
                        stroke-linecap="round"></path>
                    {/* LOW */}
                    <path
                        d={`M 45.88425608935777 6.192915503745162 A ${RADIUS} ${RADIUS} 0 0 1 62.31904483262065 7.759721421232527`}
                        stroke="#E1E7EB"
                        fill="none"
                        stroke-width="4"
                        stroke-linecap="round"></path>
                    {/* MEDIUM */}
                    <path
                        d={`M 67.77387663242357 9.749666964664904 A ${RADIUS} ${RADIUS} 0 0 1 81.35697639031021 19.133512806645328`}
                        stroke="#E1E7EB"
                        fill="none"
                        stroke-width="4"
                        stroke-linecap="round"></path>
                    {/* HIGH */}
                    <path
                        d={`M 85.1483635955568 23.531291369722304 A ${RADIUS} ${RADIUS} 0 0 1 91.59754139263299 35.65968793616452`}
                        stroke="#E1E7EB"
                        fill="none"
                        stroke-width="4"
                        stroke-linecap="round"></path>
                    {/* VERYHIGH */}
                    <path
                        d={`M 93.1236326880653 41.26201946758718 A ${RADIUS} ${RADIUS} 0 0 1 89.81239030850486 68.73428882886319`}
                        stroke="#E1E7EB"
                        fill="none"
                        stroke-width="4"
                        stroke-linecap="round"></path>
                </g>
            </g>
            {/* This is the filled in portion of the dial, i.e. the foreground */}
            <g>
                <g>
                    {/* If better than LOW, fill VERY LOW */}
                    {score >= RatingThreshold.LOW && (
                        <path
                            d={`M 10.187609691495148 68.73428882886321 A ${RADIUS} ${RADIUS} 0 0 1 40.15168157318339 7.116312843179813`}
                            stroke={highlight}
                            fill="none"
                            stroke-width="4"
                            stroke-linecap="round"
                        />
                    )}
                    {/* If better than MEDIUM, fill LOW*/}
                    {score >= RatingThreshold.MEDIUM && (
                        <path
                            d={`M 45.88425608935777 6.192915503745162 A ${RADIUS} ${RADIUS} 0 0 1 62.31904483262065 7.759721421232527`}
                            stroke={highlight}
                            fill="none"
                            stroke-width="4"
                            stroke-linecap="round"></path>
                    )}
                    {/* If better than HIGH, fill MEDIUM */}
                    {score >= RatingThreshold.HIGH && (
                        <path
                            d={`M 67.77387663242357 9.749666964664904 A ${RADIUS} ${RADIUS} 0 0 1 81.35697639031021 19.133512806645328`}
                            stroke={highlight}
                            fill="none"
                            stroke-width="4"
                            stroke-linecap="round"></path>
                    )}
                    {/* If better than VERYHIGH, fill HIGH */}
                    {score >= RatingThreshold.VERYHIGH && (
                        <path
                            d={`M 85.1483635955568 23.531291369722304 A ${RADIUS} ${RADIUS} 0 0 1 91.59754139263299 35.65968793616452`}
                            stroke={highlight}
                            fill="none"
                            stroke-width="4"
                            stroke-linecap="round"></path>
                    )}
                    {partialStroke(score, highlight)}
                </g>

                {/* This is the circle marker indicating the actual score */}
                <g>
                    <circle r="6" fill={highlight} cx={circleX} cy={circleY}></circle>
                    <circle r="2.5" fill="#fff" cx={circleX} cy={circleY}></circle>
                </g>
            </g>
            {/* This is the central text */}
            <g>
                <text x={ORIGIN.X} text-anchor="middle" y={ORIGIN.Y + 4} font-size="28">
                    {String(score)}
                </text>
                <text x={ORIGIN.X} text-anchor="middle" y={ORIGIN.Y + 20} font-size="8">
                    {rating}
                </text>
            </g>
        </svg>
    );
};

export default ScoreDial;

// // VERY LOW START / END
// // d={`M 10.187609691495148 68.73428882886321 A ${RADIUS} ${RADIUS} 0 0 1 40.15168157318339 7.116312843179813`}
// // LOW START / END
// // d={`M 45.88425608935777 6.192915503745162 A ${RADIUS} ${RADIUS} 0 0 1 62.31904483262065 7.759721421232527`}
// // MEDIUM START / END
// // d={`M 67.77387663242357 9.749666964664904 A ${RADIUS} ${RADIUS} 0 0 1 81.35697639031021 19.133512806645328`}
// // HIGH START / END
// // d={`M 85.1483635955568 23.531291369722304 A ${RADIUS} ${RADIUS} 0 0 1 91.59754139263299 35.65968793616452`}
// // VERYHIGH START / END
// // d={`M 93.1236326880653 41.26201946758718 A ${RADIUS} ${RADIUS} 0 0 1 89.81239030850486 68.73428882886319`}

// const distDial = Math.sqrt((89.81239030850486 - 10.187609691495148) ** 2 + (68.73428882886319 - 68.73428882886321) ** 2);
// const distVeryLOWToVeryLOW = Math.sqrt((40.15168157318339 - 10.187609691495148) ** 2 + (7.116312843179813 - 68.73428882886321) ** 2);
// const distVeryLOWToLOW = Math.sqrt((45.88425608935777 - 10.187609691495148) ** 2 + (6.192915503745162 - 68.73428882886321) ** 2);
// const distVeryLOWToMEDIUM = Math.sqrt((67.77387663242357 - 10.187609691495148) ** 2 + (9.749666964664904 - 68.73428882886321) ** 2);
// const distVeryLOWToHIGH = Math.sqrt((85.1483635955568 - 10.187609691495148) ** 2 + (23.531291369722304 - 68.73428882886321) ** 2);
// const distVeryLOWToVERYHIGH = Math.sqrt((93.1236326880653 - 10.187609691495148) ** 2 + (41.26201946758718 - 68.73428882886321) ** 2);

// const veryLOWPoint = 102.266/180*Math.PI / 250;
// const totalRangePoint = 230.4/180*Math.PI / 550;

// const totalRange = 850-300
// const vLOWRange = 549-300
// const LOWRange = 649-550;
// const MEDIUMRange = 699-650;
// const HIGHRange = 749-700;
// const VERYHIGHRange = 850-750
// const vLOWPercent = vLOWRange / totalRange;
// const LOWPercent = LOWRange / totalRange;
// const MEDIUMPercent = MEDIUMRange / totalRange;
// const HIGHPercent = HIGHRange / totalRange;
// const VERYHIGHPercent = VERYHIGHRange / totalRange;
// console.log({vLOWPercent, LOWPercent, MEDIUMPercent, HIGHPercent, VERYHIGHPercent})

// const distHIGHEnd = Math.sqrt((85.1483635955568 - 10.187609691495148) ** 2 + (23.531291369722304 - 68.73428882886321) ** 2);

// Math.sqrt((91.59754139263299-50)**2+(50- 35.65968793616452)**2)
