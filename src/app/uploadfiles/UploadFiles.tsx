import { FunctionComponent } from 'react';
import './UploadFiles.css';


const UploadFiles:FunctionComponent = () => {
  	return (
    		<div className="uploadfiles">
      			<div className="upload-your-notes-parent">
        				<b className="upload-your-notes">Upload your Notes</b>
        				<div className="drag-or-drop-your-files-parent">
          					<b className="drag-or-drop">Drag or Drop your files</b>
          					<b className="or">Or</b>
          					<div className="upload-files-wrapper">
            						<b className="upload-files">Upload files</b>
          					</div>
        				</div>
        				<b className="max-size-300">Max size: 300 MB</b>
        				<b className="supported-file-types">Supported file types: PDF, DOCX, TXT</b>
      			</div>
    		</div>);
};

export default UploadFiles;