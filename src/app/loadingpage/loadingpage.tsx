"use client";

import { FunctionComponent } from 'react';
import './loadingpage.css';


const LoadingFiles:FunctionComponent = () => {
  	return (
    		<div className="loadingfiles">
      			<div className="loading-files-parent">
        				<b className="loading-files">Loading Files...</b>
        				<div className="frame-child" />
      			</div>
    		</div>);
};

export default LoadingFiles;