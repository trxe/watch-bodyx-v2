import styles from "../styles/Utils.module.css"

const PollBar = ({option, value, maxValue}) => {
    return <div className={styles.optionBox}>
        <div className={styles.optionLabel}>
            <input type="radio" name="radio"/>
			<span>{option}</span>
            <div className={styles.percent}>{(100 * value/maxValue).toFixed(0)}%</div>
        </div>
        <div className={styles.optionBar} 
            style={{width: `${(value/maxValue).toFixed(2)}%`}}/>
    </div>;
}

export default PollBar;