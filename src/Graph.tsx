import React, { Component } from 'react';
import { Table } from '@finos/perspective';
import { ServerRespond } from './DataStreamer';
import './Graph.css';

/**
 * Props declaration for <Graph />
 */
interface IProps {
    data: ServerRespond[],
}

/**
 * Perspective library adds load to HTMLElement prototype.
 * This interface acts as a wrapper for Typescript compiler.
 */
interface PerspectiveViewerElement extends HTMLElement {
    load: (table: Table) => void,
}

/**
 * React component that renders Perspective based on data
 * parsed from its parent through data property.
 */
class Graph extends Component<IProps, {}> {
    // Perspective table
    table: Table | undefined;

    render() {
        return React.createElement('perspective-viewer');
    }

    componentDidMount() {
        // Get the Perspective viewer element from the DOM
        const elem = document.getElementsByTagName('perspective-viewer')[0] as unknown as PerspectiveViewerElement;

        const schema = {
            stock: 'string',
            top_ask_price: 'float',
            top_bid_price: 'float',
            timestamp: 'date',
        };

        if (window.perspective && window.perspective.worker()) {
            // Create the Perspective table with the defined schema
            this.table = window.perspective.worker().table(schema);
        }
        
        if (this.table) {
            // Configure the Perspective viewer
            elem.load(this.table);
            elem.setAttribute("view", "y_line");
            elem.setAttribute("column-pivots", '["stock"]');
            elem.setAttribute("row-pivots", '["timestamp"]');
            elem.setAttribute("columns", '["top_ask_price"]');
            elem.setAttribute("aggregates",
                '{"stock":"distinct_count", "top_ask_price":"avg", "top_bid_price":"avg", "timestamp":"distinct_count"}'
            );
        }
    }

    componentDidUpdate(prevProps: IProps) {
        // Only update the table if the data has changed
        if (this.table && prevProps.data !== this.props.data) {
            // Convert data to Perspective's expected format
            const dataToUpdate = this.props.data.reduce((acc, el: any) => {
                acc.stock.push(el.stock);
                acc.top_ask_price.push(el.top_ask?.price || 0);
                acc.top_bid_price.push(el.top_bid?.price || 0);
                acc.timestamp.push(new Date(el.timestamp)); // Ensure the timestamp is a Date object
                return acc;
            }, {
                stock: [] as string[],
                top_ask_price: [] as number[],
                top_bid_price: [] as number[],
                timestamp: [] as Date[],
            });

            // Update the Perspective table with new data
            this.table.update(dataToUpdate);
        }
    }
}

export default Graph;
