import { useRef, useState } from "react";
import { usePoll } from "../context/poll.context";
import { useSockets } from "../context/socket.context";
import { AiOutlineCheck, AiOutlineClose, AiFillEdit, AiFillDelete } from "react-icons/ai"
import styles from "../styles/Poll.module.css"
import Modal from "../utils/modal";
import PollBar from "../utils/pollbar";
import EVENTS from "../config/events";

const Field = ({index, type, placeholder, startEdit, editing, text, cancelling, saving, deleting}) => {
    const [isEdit, setEdit] = useState(startEdit);
    const textRef = useRef(null);

    // the function passed in must take in the textRef as input
    const addToggle = (fn?: Function) => () => {
        if (textRef.current != null) textRef.current.value = textRef.current.value.trim();
        if (fn != null) fn(textRef, index);
        setEdit(!isEdit);
    }

    return <div className={`${styles.field} ${type}`}>
        <div className={`${styles.fieldText}`}>
            {isEdit && <textarea ref={textRef} rows={1} defaultValue={text} placeholder={placeholder}/>}
            {!isEdit && (text || <em>{placeholder}</em>)}
        </div>
        {!isEdit && <button className="iconButton" onClick={addToggle(editing)}><AiFillEdit/></button>}
        {isEdit && <button className="iconButton" onClick={addToggle(saving)}><AiOutlineCheck/></button>}
        {!isEdit && <button className="iconButton" onClick={() => deleting(textRef, index)} disabled={!deleting}><AiFillDelete/></button>}
        {isEdit && <button className="iconButton" onClick={addToggle(cancelling)}><AiOutlineClose/></button>}
    </div>
}

const PollViewContainer = ({isPreview}) => {
    const {poll, totalVoters} = usePoll();

    const submit = () => {
        if (isPreview) return;
    }

    return <div>
        <a href="#openModal">Open</a>
        <Modal id="openModal" width={'60%'}>
            <h3>{poll.question}</h3>
            {poll.options.map((option, index) => <PollBar key={index} option={option.label} value={option.votes} maxValue={totalVoters} />)}
            <button onClick={submit}>Vote</button>
            <a href="#closeModal" title="Close" className={styles.closeModal}>Close</a>
        </Modal>
    </div>
}

const PollSettingsContainer = () => {
    const {poll, setPoll, question, setQuestion, options, setOptions, totalVoters} = usePoll();
    const {socket, setNotif} = useSockets();
    const [isAdding, setAdding] = useState(false);
    const [isEditing, setEditing] = useState(false);

    //  editing the question
    const editQuestion = (textRef, index) => {
        setEditing(false);
        const prevQn = poll.question;
        poll.question = textRef.current.value;
        setQuestion(poll.question);
        setPoll(poll);
        // send to server
        socket.emit(EVENTS.CLIENT.UPDATE_POLL, {question: poll.question, options: poll.options}, (res) => {
            console.log('edited question', poll.question);
            if (res != null && res.messageType === 'error') {
                console.log('error and revert')
                setNotif(res);
                setQuestion(prevQn);
            }
        });
    }

    // send to the poll
    const createNewOption = (textRef, index: number) => {
        setAdding(false);
        if (!textRef.current.value || textRef.current.value.length == 0) return;
        const prevOptions = [...poll.options];
        console.log('opt list before', prevOptions);
        poll.addOption(textRef.current.value);
        console.log('opt list after', poll.options);
        setOptions(poll.options);
        setPoll(poll);
        // send to server
        socket.emit(EVENTS.CLIENT.UPDATE_POLL, {question: poll.question, options: poll.options}, (res) => {
            if (textRef.current && textRef.current.value.length != 0) textRef.current.value = '';
            // there is an issue with poll, which is that it's values aren't updating
            // considering removing the poll class
            console.log('create new options', poll.options);
            if (res != null && res.messageType === 'error') {
                console.log('error and revert')
                setNotif(res);
                setOptions(prevOptions);
            }
        });
    }

    // edit poll option
    const editOption = (textRef, index: number) => {
        setEditing(false);
        console.log('edit', index);
        if (index >= poll.options.length || index < 0) return;
        const prevOptions = [...poll.options];
        poll.editOption(textRef.current.value, index);
        console.log('post-edit', poll.options);
        // send to server
        setOptions([...poll.options]);
        setPoll(poll);
        socket.emit(EVENTS.CLIENT.UPDATE_POLL, {question: poll.question, options: poll.options}, (res) => {
            if (textRef.current && textRef.current.value.length != 0) textRef.current.value = '';
            console.log('edited options', poll.options);
            if (res != null && res.messageType === 'error') {
                console.log('error and revert')
                setNotif(res);
                setOptions(prevOptions);
            }
        });
    }

    // delete poll option
    const deleteOption = (textRef, index: number) => {
        setEditing(false);
        console.log('delete', textRef.current, index);
        if (index >= poll.options.length || index < 0) return;
        const prevOptions = [...poll.options];
        poll.removeOption(index);
        console.log('post-delete', poll.options);
        // send to server
        setOptions([...poll.options]);
        socket.emit(EVENTS.CLIENT.UPDATE_POLL, {question: poll.question, options: poll.options}, (res) => {
            if (textRef.current && textRef.current.value.length != 0) textRef.current.value = '';
            console.log('deleted options', poll.options);
            if (res != null && res.messageType === 'error') {
                console.log('error and revert')
                setNotif(res);
                setOptions(prevOptions);
            }
        });
    }

    // toggle start stop

    return <div className={styles.pollWrapper}>
        <div className={styles.pollHeader}>
            <h3>Poll</h3>
            <button disabled={isEditing}>Start</button>
            <PollViewContainer isPreview={true}/>
            <span>Voters: {totalVoters}</span>
        </div>
        <div className={styles.pollSettings}>
            <Field type={styles.pollTitle} 
                index={0}
                startEdit={false}
                placeholder={'Insert Title'} 
                editing={() => setEditing(true)}
                cancelling={() => setEditing(false)}
                saving={editQuestion}
                deleting={null}
                text={question} />
            {options.map((option, index) => 
                <Field type={styles.pollOption} 
                    key={index}
                    index={index}
                    startEdit={false}
                    placeholder={'Edit option'} 
                    editing={() => setEditing(true)}
                    cancelling={() => setEditing(false)}
                    saving={editOption}
                    deleting={deleteOption}
                    text={option.label} />
            )}
            {isAdding && 
                <Field type={styles.pollOption} 
                    index={poll.options.length}
                    startEdit={true}
                    placeholder={'New option'} 
                    editing={() => setAdding(true)}
                    cancelling={() => setAdding(false)}
                    saving={createNewOption}
                    deleting={null}
                    text={null} />
            }
            {!isAdding && <div onClick={() => setAdding(true)} 
                className={`${styles.field} ${styles.addOption}`}>
                Add option</div>}
        </div>
    </div>;

}

export default PollSettingsContainer;