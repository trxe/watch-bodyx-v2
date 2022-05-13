import { ChangeEventHandler, FC } from "react"
import styles from "../styles/Utils.module.css"

interface PollInfo {
    option: string
    handleSelect: ChangeEventHandler
    selected: number
    index: number
    value?: number
    maxValue?: number
}

const PollBar:FC<PollInfo> = ({option, index, value, maxValue, selected, handleSelect}) => {
    return <div className={styles.optionBox}>
        <div className={styles.optionLabel}>
            <input disabled={!handleSelect} checked={selected == index} value={index} onChange={handleSelect} type="radio" name="radio"/>
			<span>{option}</span>
            {value != null && maxValue != null && <div className={styles.percent}>{(100 * value/maxValue).toFixed(0)}%</div>}
        </div>
        {value != null && maxValue != null && <div className={styles.optionBar} 
            style={{width: `${(100 * value/maxValue).toFixed(0)}%`}}/>}
    </div>;
}

export default PollBar;